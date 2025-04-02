import { initializeApp } from "firebase-admin/app"
import {setGlobalOptions} from "firebase-functions";

// Initialize app
initializeApp()
setGlobalOptions({ region: "your-region" })

// CORS
export const cors = [
    "http://localhost:3000",
    "https://imlaa.fr"
]