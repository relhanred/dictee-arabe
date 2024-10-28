import { onCall } from "firebase-functions/v2/https"
import { cors } from "./main.js"

export const createDictee = onCall(({cors}) => {
    // Create a post

    console.log("Creating a new post...")
    // ...
})