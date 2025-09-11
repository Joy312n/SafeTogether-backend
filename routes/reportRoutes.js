import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Report from "../models/Report.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });






// Citizen: Create report
router.post("/create", protect, upload.single("image"), async (req, res) => {
    try {
        let imageUrl = "";
        // console.log(req.file);

        // console.log("Cloudinary key:", cloudinary.config(), process.env.CLOUD_KEY);
        if (req.file) {
            // console.log("Cloudinary key:", cloudinary.config().api_key);

            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto"
            });
            // console.log(result);

            imageUrl = result.secure_url;
        }

        const report = await Report.create({
            location: req.body.location,
            description: req.body.description,
            imageUrl,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            createdBy: req.user.id,
        });


        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Dashboard: List all reports
router.get("/list", protect, async (req, res) => {
    try {
        const reports = await Report.find().populate("createdBy", "name email");
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET only verified reports
router.get("/verified", async (req, res) => {
    try {
        const reports = await Report.find({ status: "verified" });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Official: Verify/Reject report
router.put("/verify/:id", protect, authorize(["official"]), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report not found" });

        report.status = req.body.status; // verified / rejected
        await report.save();

        res.json({ message: "Report updated", report });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/stats", protect, authorize(["analyst"]), async (req, res) => {
    try {
        const countByStatus = await Report.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const keywordFrequency = await Report.aggregate([
            { $unwind: { path: "$description", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$description", count: { $sum: 1 } } }
        ]);

        res.json({ countByStatus, keywordFrequency });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


export default router;
