import cors from "cors";
import express from "express";
import router from "./routes";
import { sequelize } from "./db/sqlite";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(router);

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
