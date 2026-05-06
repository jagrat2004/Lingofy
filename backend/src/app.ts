import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import preferenceRoutes from "./routes/preferenceRoutes";


const app = express();

/*
=================================
Global Middlewares
=================================
*/

// CORS
app.use(cors());

// Parse JSON body
app.use(express.json());

// Parse URL encoded data
app.use(express.urlencoded({ extended: true }));

/*
=================================
Routes
=================================
*/

app.use("/api/auth", authRoutes);
app.use("/api/preferences", preferenceRoutes);


/*
=================================
Health Check Route
=================================
*/

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Lingofy API running"
  });
});

export default app;