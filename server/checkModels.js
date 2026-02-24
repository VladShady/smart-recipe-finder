const axios = require('axios');
require('dotenv').config();

async function check() {
  console.log("Запитуємо список моделей у Google...");
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    
    // Фільтруємо тільки ті моделі, які вміють генерувати текст
    const textModels = res.data.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name.replace('models/', '')); // Прибираємо префікс 'models/' для зручності
      
    console.log("\n✅ Ось моделі, які ТОЧНО працюють з твоїм ключем:");
    console.log(textModels);
    
  } catch (e) {
    console.error("\n❌ Помилка доступу:", e.response ? e.response.data : e.message);
  }
}

check();