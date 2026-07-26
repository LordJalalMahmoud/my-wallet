import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح GEMINI_API_KEY غير متوفر في البيئة." },
        { status: 400 }
      );
    }

    const { prompt, mode, contextData } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    if (mode === "parse_text") {
      const parseSystemInstruction = `
أنت مساعد محاسبي متألق ومختص باللغة العربية لمندوبي التوصيل والدليفري.
مهمتك هي تحليل نص مكتوب بالعامية المصرية أو العربية يتعلق بأوردرات، تحصيلات، مصاريف، ديون أو مستحقات.
قم بإخراج استجابة بترميز JSON نقي يحتوي على مصفوفة العمليات المستخرجة:

التنسيق المطلوب JSON حصراً:
{
  "incomes": [
    { "amount": 100, "source": "اسم المصدر أو المطعم", "category": "orders|tips|salary|other", "notes": "ملاحظة" }
  ],
  "expenses": [
    { "amount": 50, "description": "الوصف", "category": "order_upfront|fuel|bike_maintenance|phone|meals|home|other", "notes": "ملاحظة" }
  ],
  "liabilities": [
    { "creditorName": "اسم الدائن", "totalAmount": 200, "dueDate": "YYYY-MM-DD", "category": "rent|installment|jam3eya|company|personal_debt|utility|other" }
  ],
  "receivables": [
    { "debtorName": "اسم المديون", "totalAmount": 150, "expectedDate": "YYYY-MM-DD", "category": "restaurant|client|company|friend|other" }
  ],
  "summary": "ملخص سريع باللغة العربية للعمليات المستخرجة"
}
لا تضف أي نص خارج كود JSON.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `البيانات المدخلة من المندوب:\n"${prompt}"` }] }
        ],
        config: {
          systemInstruction: parseSystemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      return NextResponse.json(JSON.parse(responseText));
    } else {
      // mode === 'advice' or default
      const systemInstruction = `
أنت "المحاسب الذكي للمندوب" - مستشار مالي متخصص لدعم مندوبي التوصيل والدليفري والسائقين باللغة العربية (اللهجة المصرية البسيطة والمشجعة).
تحلل الأرقام المالية للمندوب وتزوده بنصائح عملية فورية لتقليل المصاريف (بنزين، صيانة المكنة، المشروبات)، وسداد الديون، وتحقيق الأهداف المالية، وحساب الخطة اليومية للوصول للهدف.
أجب باختصار وبنقاط واضحة ومباشرة وودودة.
`;

      const userContextText = contextData ? `
معطيات المندوب الحالية:
- الرصيد الحالي بالمحفظة: ${contextData.walletBalance} ج.م
- إجمالي الديون ("فلوس عليا"): ${contextData.totalLiabilities} ج.م
- إجمالي المستحقات ("فلوس ليا"): ${contextData.totalReceivables} ج.م
- الفجوة المالية الحالية ("لسة محتاج"): ${contextData.netGap} ج.م (${contextData.isSafe ? "أمان مالي / فائض" : "عجز مطلوب تغطيته"})
- المستهدف اليومي: ${contextData.dailyTargetEarnings || 350} ج.م
- الأهداف المالية القادمة: ${JSON.stringify(contextData.goals || [])}
` : "";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${userContextText}\n\nسؤال أو طلب المندوب:\n${prompt || "حلل وضعي المالي وأعطني خطة عملية لتقليل الفجوة المالية وتحسين دخلي اليومي."}` }]
          }
        ],
        config: {
          systemInstruction,
        }
      });

      return NextResponse.json({ text: response.text });
    }
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء الاتصال بالمساعد الذكي." },
      { status: 500 }
    );
  }
}
