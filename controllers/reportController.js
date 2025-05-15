const fs = require('fs');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const { db, GEMINI_API_URL } = require('../config/firebase');

const reportCollection = db.collection("Report");

// Pastikan folder uploads ada
const uploadFolder = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar jpg, jpeg, atau png yang diperbolehkan.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
});

// Helper deteksi kategori
const detectCategory = (text) => {
  const categories = [];
  const lowerText = text.toLowerCase();
  if (lowerText.includes('organic')) categories.push('organic');
  if (lowerText.includes('non-organic') || lowerText.includes('non organic')) categories.push('non-organic');
  if (lowerText.includes('hazardous')) categories.push('hazardous');
  return categories;
};

// CREATE
const createReport = [
  upload.single('image'),
  async (req, res) => {
    try {
      const imagePath = req.file.path;
      const relativePath = path.relative(path.join(__dirname, '..'), imagePath); // Simpan path relatif

      const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
      const { UserID, Location, Challenge_id } = req.body;

      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [{
            parts: [
              {
                text: "Berdasarkan gambar ini, identifikasi jenis sampah yang ada. Tentukan apakah ini termasuk sampah Organic, Non-organic, atau Hazardous. Jika sampah ini Non-organic, klasifikasikan lebih lanjut menjadi plastik, logam, kertas, kaca, atau karet. Jika ini termasuk Hazardous, jelaskan jenis bahan berbahaya yang ada. Jika Organic, sebutkan apakah ini sampah Organic yang dapat terurai atau tidak. Berikan jawaban yang lengkap berdasarkan kategori sampah yang terdeteksi. (dont use character \n, \, /) (limit to just 50 words) (berikan responsenya dalam bahasa inggris) (berikan kategori dengan format [Organic, Non-organic, Hazardous])"
              },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: imageBase64
                }
              }
            ]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const resultText = response.data.candidates[0].content.parts[0].text;
      const categoryTrash = detectCategory(resultText);

      const newReport = {
        UserID,
        ImageURL: relativePath,
        Result: resultText,
        Category_trash: categoryTrash,
        Location,
        Challenge_id: Challenge_id || null,
        Created_at: new Date()
      };

      const docRef = await reportCollection.add(newReport);

      res.status(201).json({
        id: docRef.id,
        message: "Report created with Gemini analysis",
        result: resultText,
        category: categoryTrash
      });
    } catch (error) {
      console.error("Create report error:", error.response?.data || error.message);
      res.status(500).json({ message: "Failed to create report", error: error.message });
    }
  }
];

// READ
const getReports = async (req, res) => {
  try {
    const snapshot = await reportCollection.get();
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(reports);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get reports", error: error.message });
  }
};

// READ by ID
const getReportById = async (req, res) => {
  try {
    const reportId = req.params.id;

    const reportDoc = await reportCollection.doc(reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({ id: reportDoc.id, ...reportDoc.data() });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get report", error: error.message });
  }
};

// UPDATE
const updateReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const {
      UserID,
      ImageURL,
      Results,
      Category_trash,
      Location,
      Challenge_id,
    } = req.body;

    const reportDoc = await reportCollection.doc(reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ message: "Report not found" });
    }

    const reportData = reportDoc.data();
    if (reportData.UserID !== UserID) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this report" });
    }

    const updatedData = {
      ImageURL,
      Results,
      Category_trash,
      Location,
      Challenge_id,
    };
    await reportCollection.doc(reportId).update(updatedData);

    res.status(200).json({ message: "Report updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update report", error: error.message });
  }
};

// DELETE
const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { UserID } = req.body;

    const reportDoc = await reportCollection.doc(reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ message: "Report not found" });
    }

    const reportData = reportDoc.data();
    if (reportData.UserID !== UserID) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this report" });
    }

    await reportCollection.doc(reportId).delete();
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete report", error: error.message });
  }
};

// COUNT Reports by User in Challenge
const countReportsByUserInChallenge = async (req, res) => {
  try {
    const userId = req.params.userId;

    const snapshot = await reportCollection
      .where("UserID", "==", userId)
      .where("Challenge_id", "!=", null)
      .get();

    const count = snapshot.size;
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      userId,
      total_reports_in_challenge: count,
      reports,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to count reports", error: error.message });
  }
};

// Fungsi menghitung jumlah report untuk semua user
const getReportsCountByUser = async (req, res) => {
  try {
    const snapshot = await reportCollection.get();

    const userReportCount = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const userId = data.UserID;

      if (userId) {
        if (!userReportCount[userId]) {
          userReportCount[userId] = 0;
        }
        userReportCount[userId] += 1;
      }
    });

    const sortedLeaderboard = Object.entries(userReportCount)
      .map(([userId, count]) => ({ userId, totalReports: count }))
      .sort((a, b) => b.totalReports - a.totalReports)
      .slice(0, 40);

    res.status(200).json(sortedLeaderboard);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to count reports by user",
        error: error.message,
      });
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  countReportsByUserInChallenge,
  getReportsCountByUser,
};
