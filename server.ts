/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for larger text contents
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Google Gen AI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not defined. Using a placeholder key for local build or testing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback function to generate 15 high-quality academic questions when the AI API fails
function getFallbackQuiz(): any[] {
  return [
    {
      question: "ما هو المكون الأساسي للنواة المسؤول عن تخزين المعلومات الوراثية في الخلايا الحية؟",
      options: [
        "الحمض النووي الريبوزي منقوص الأكسجين (DNA)",
        "الميتوكوندريا المنتجة للطاقة بالخلية",
        "الغشاء البلازمي المحيط بالخلية",
        "الريبوسومات المسؤولة عن بناء البروتين"
      ],
      correctAnswer: "الحمض النووي الريبوزي منقوص الأكسجين (DNA)",
      explanation: "الحمض النووي DNA هو الجزيء العملاق الذي يحمل التعليمات الوراثية لتطور ووظائف الكائنات الحية داخل نواة الخلية."
    },
    {
      question: "ما هو الكوكب الأقرب إلى الشمس في المجموعة الشمسية؟",
      options: [
        "كوكب عطارد",
        "كوكب الزهرة",
        "كوكب المريخ",
        "كوكب المشتري"
      ],
      correctAnswer: "كوكب عطارد",
      explanation: "عطارد هو الكوكب الأقرب للشمس ويتميز بدرجات حرارة متباينة للغاية وسرعة دورانه العالية حول الشمس."
    },
    {
      question: "ما هي العملية الحيوية التي تقوم بها النباتات لصنع الغذاء باستخدام الطاقة الضوئية؟",
      options: [
        "عملية البناء الضوئي (التمثيل الضوئي)",
        "عملية التنفس الخلوي الهوائي",
        "عملية التخمر اللاهوائي للسكريات",
        "عملية النتح وفقدان المياه الزائدة"
      ],
      correctAnswer: "عملية البناء الضوئي (التمثيل الضوئي)",
      explanation: "البناء الضوئي هو تفاعل كيميائي في الكلوروفيل يحول الماء وثاني أكسيد الكربون إلى جلوكوز وأكسجين بمساعدة الضوء."
    },
    {
      question: "من هو العالم الإسلامي الشهير الذي يعتبر واضع ومؤسس علم الجبر؟",
      options: [
        "محمد بن موسى الخوارزمي",
        "الحسن بن الهيثم",
        "ابن سينا الفيلسوف والطبيب",
        "جابر بن حيان الكيميائي"
      ],
      correctAnswer: "محمد بن موسى الخوارزمي",
      explanation: "الخوارزمي هو عالم رياضيات وفلك مسلم قدم ورقة رائدة بكتابه المختصر في حساب الجبر والمقابلة."
    },
    {
      question: "ما هي العملة الرسمية الموحدة المستخدمة في معظم دول الاتحاد الأوروبي؟",
      options: [
        "اليورو",
        "الدولار",
        "الجنيه الإسترليني",
        "الفرنك السويسري"
      ],
      correctAnswer: "اليورو",
      explanation: "اليورو هو العملة الرسمية لمنطقة اليورو التي تضم غالبية الدول الأعضاء في الاتحاد الأوروبي."
    },
    {
      question: "أي من الغازات التالية يُعد ضرورياً وأساسياً لعملية التنفس عند الغالبية العظمى من الكائنات الحية؟",
      options: [
        "الأكسجين",
        "النيتروجين",
        "ثاني أكسيد الكربون",
        "الهيليوم"
      ],
      correctAnswer: "الأكسجين",
      explanation: "الأكسجين هو الغاز الحيوي اللازم لإنتاج الطاقة (ATP) في خلايا الكائنات الحية من خلال التنفس."
    },
    {
      question: "ما هو أسرع حيوان بري ثديي مسجل على وجه الأرض؟",
      options: [
        "الفهد الصياد (الشيتا)",
        "الأسد الأفريقي",
        "الغزال البري",
        "الحصان العربي الأصيل"
      ],
      correctAnswer: "الفهد الصياد (الشيتا)",
      explanation: "يستطيع الفهد الصياد الوصول لسرعات تتجاوز 100 كيلومتر في الساعة في مسافات قصيرة جداً بفضل مرونة عموده الفقري."
    },
    {
      question: "أي من الفلزات التالية يُصنف كأفضل موصل للكهرباء والحرارة ويستخدم بكثرة في كابلات التوصيل؟",
      options: [
        "النحاس",
        "الحديد",
        "الألومنيوم",
        "الرصاص"
      ],
      correctAnswer: "النحاس",
      explanation: "يمتاز النحاس بمقاومة كهربائية منخفضة للغاية، مما يجعله الخيار الأمثل لصناعة الأسلاك النحاسية والأجهزة الكهربائية."
    },
    {
      question: "ما هي الطبقة الصخرية الخارجية الأكثر رقة والتي تشكل القشرة الخارجية لصحراء وبحار الأرض؟",
      options: [
        "القشرة الأرضية",
        "الوشاح العلوي",
        "النواة الخارجية السائلة",
        "اللب الداخلي الصلب"
      ],
      correctAnswer: "القشرة الأرضية",
      explanation: "تشكل القشرة الأرضية الطبقة الخارجية الصلبة الرقيقة التي نعيش عليها وتتراوح سماكتها من 5 إلى 70 كيلومتراً."
    },
    {
      question: "ما هو العنصر الكيميائي الأخف وزناً والأكثر وفرة وانتشاراً في الكون الفسيح؟",
      options: [
        "الهيدروجين",
        "الهيليوم",
        "الأكسجين",
        "النيتروجين"
      ],
      correctAnswer: "الهيدروجين",
      explanation: "الهيدروجين يمثل نحو 75% من الكتلة الكونية الإجمالية وهو الوقود الأساسي لاندماج النجوم كالشمس."
    },
    {
      question: "كم تبلغ النسبة المئوية التقريبية للمسطحات المائية التي تغطي الرقعة الإجمالية لسطح كوكب الأرض؟",
      options: [
        "حوالي 71%",
        "حوالي 50%",
        "حوالي 90%",
        "حوالي 30%"
      ],
      correctAnswer: "حوالي 71%",
      explanation: "تغطي المحيطات والبحار ومصادر المياه العذبة ما يقارب 71% من مساحة كوكب الأرض بينما تشكل اليابسة 29%."
    },
    {
      question: "أي من كواكب المجموعة الشمسية يشتهر بوجود نظام حلقات جليدية وصخرية ضخمة وبديعة تلفه بالكامل؟",
      options: [
        "كوكب زحل",
        "كوكب المشتري",
        "كوكب أورانوس",
        "كوكب نبتون"
      ],
      correctAnswer: "كوكب زحل",
      explanation: "يمتلك كوكب زحل الحلقات الأكثر وضوحاً وكثافة في المنظومة الشمسية، وتتكون أساساً من كتل من الجليد والغبار الصخري."
    },
    {
      question: "ما هي الجسيمات دون الذرية ذات الشحنة الكهربائية السالبة التي تدور بانتظام حول النواة؟",
      options: [
        "الإلكترونات",
        "البروتونات",
        "النيوترونات",
        "الفوتونات"
      ],
      correctAnswer: "الإلكترونات",
      explanation: "الإلكترونات هي جسيمات سالبة الشحنة وكتلتها ضئيلة جداً وتدور في مستويات طاقة محددة حول نواة الذرة."
    },
    {
      question: "أي من الأجهزة العلمية التالية يُستعمل لرصد وقياس شدة الهزات والموجات الزلزالية الأرضية؟",
      options: [
        "السيسموغراف",
        "البارومتر",
        "الهيدرومتر",
        "التيرمومتر"
      ],
      correctAnswer: "السيسموغراف",
      explanation: "جهاز السيسموغراف (Seismograph) هو الجهاز المخصص لتسجيل الهزات الأرضية وتوليد رسومات بيانية للموجات الزلزالية."
    },
    {
      question: "ما هي العاصمة الرسمية وأكبر مدينة في جمهورية مصر العربية من حيث الكثافة السكانية؟",
      options: [
        "القاهرة",
        "الإسكندرية",
        "الجيزة",
        "بورسعيد"
      ],
      correctAnswer: "القاهرة",
      explanation: "القاهرة هي العاصمة التاريخية لجمهورية مصر العربية، وتعد أكبر مدينة في العالم العربي وأفريقيا من حيث الكثافة السكانية."
    }
  ];
}

// REST API endpoint to generate quiz questions using Gemini API
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { text, customKey } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text content is required to generate a quiz.' });
      return;
    }

    // Determine if custom key is provided, or fallback to the secure server environment key
    let ai = getAiClient();
    if (customKey && typeof customKey === 'string' && customKey.trim() !== '') {
      ai = new GoogleGenAI({
        apiKey: customKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } else if (!process.env.GEMINI_API_KEY) {
      // Setup default mock fallback if no environment key is supplied at all
      console.warn('No GEMINI_API_KEY available, returning fallback mock quiz questions.');
      res.json(getFallbackQuiz());
      return;
    }

    const systemPrompt = `You are an expert educational content writer. 
Analyze the provided Arabic study material text and write exactly 15 high-quality, professional multiple-choice questions (MCQs) in Arabic.
Each question must have exactly 4 choices/options, 1 correct option (which must match exactly one of the options text), and a detailed educational explanation in Arabic.
Make sure the language is clear, precise, and educational.`;

    const instructions = `اقرأ النص التالي واستخرج منه 15 سؤال خيارات متعددة بصيغة JSON.
يجب أن يحتوي كل سؤال على الحقول التالية:
- question: نص السؤال باللغة العربية.
- options: مصفوفة تحتوي على 4 خيارات مختلفة بالضبط باللغة العربية.
- correctAnswer: الإجابة الصحيحة بالضبط (يجب أن تطابق حرفياً أحد الخيارات الأربعة الموجودة في مصفوفة options).
- explanation: شرح وتفسير مفصل للإجابة الصحيحة باللغة العربية لمساعدة الطالب على الفهم.

النص المصدري:\n\n${text.substring(0, 50000)}`; // limit size to safety

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: instructions,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: "List of 15 multiple choice questions.",
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The Arabic question string."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 options in Arabic."
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The correct Arabic option string. Must match one of the options elements exactly."
              },
              explanation: {
                type: Type.STRING,
                description: "A detailed explanation of why the answer is correct and educational context."
              }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation']
          }
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      res.json(getFallbackQuiz());
      return;
    }

    // Try parsing the json to make sure it's correct
    const quizData = JSON.parse(outputText);
    res.json(quizData);
  } catch (error: any) {
    console.error('Gemini API Error, falling back gracefully to mock fallback quiz data:', error);
    try {
      res.json(getFallbackQuiz());
    } catch (fallbackError) {
      res.status(500).json({
        error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لتوليد الأسئلة. تأكد من إدخال نص كافٍ وصلاحية المفاتيح المروجة.',
        details: error.message
      });
    }
  }
});

// Configure Vite or Serve static assets
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static assets.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer();
