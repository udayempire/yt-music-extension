import express from "express";
import cors from "cors";
import nowPlayingRouter from "./routes/now-playing";

const app = express();

app.use(
    cors({
        origin: [
            "chrome-extension://phpdheidlnnipcfffbhiddfmpikedahm",
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});

app.use("/api/now-playing", nowPlayingRouter);

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});