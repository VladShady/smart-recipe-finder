const axios = require('axios');
require('dotenv').config();

async function check() {
  console.log("Asking for a list of available models...");
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    
    const textModels = res.data.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name.replace('models/', ''));
      
    console.log("\nThe models that work perfectly with your key:");
    console.log(textModels);
    
  } catch (e) {
    console.error("\nAccess error:", e.response ? e.response.data : e.message);
  }
}

check();