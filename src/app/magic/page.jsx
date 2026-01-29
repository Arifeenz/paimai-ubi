'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar'; // ตรวจสอบ path ให้ตรงกับโปรเจกต์คุณ
import Footer from '@/components/Footer'; // ตรวจสอบ path ให้ตรงกับโปรเจกต์คุณ
import VoiceInput from '@/components/VoiceInput';
import ImageUpload from '@/components/ImageUpload';
import { ImagePlus, Sparkles, Copy, Check, MessageSquareQuote, MessageSquare, Tag, Video } from 'lucide-react';
import Button from '@/components/Button';
import ContentTypeCard from '@/components/ContentTypeCard';

export default function MagicPage() {
    const searchParams = useSearchParams();
    const personaId = searchParams.get('persona');

    const [transcript, setTranscript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCaption, setGeneratedCaption] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [contentType, setContentType] = useState('caption');
    const [error, setError] = useState('');
    const [tone, setTone] = useState('casual');
    const [targetAudience, setTargetAudience] = useState('general');

    // Photo Tips State
    const [photoTips, setPhotoTips] = useState('');

    // Persona data
    const personas = {
        pa_meaw: {
            name: 'ป้าแมว - ข้าวยำยะลา',
            role: 'ผู้เชี่ยวชาญอาหารปักษ์ใต้',
            emoji: '🍲',
            gradient: 'from-orange-500 to-red-500',
            bg: 'bg-orange-50'
        },
        kanah_batik: { // แก้ key ให้ตรงกับ link หน้า Landing Page (kanah_batik)
            name: 'กะนะห์ - ผ้าบาติก OTOP',
            role: 'ช่างฝีมือผ้าบาติก',
            emoji: '🎨',
            gradient: 'from-purple-500 to-pink-500',
            bg: 'bg-purple-50'
        },
        betong_tour: { // แก้ key ให้ตรงกับ link หน้า Landing Page (betong_tour)
            name: 'บังฮาริส - ท่องเที่ยวเบตง',
            role: 'ไกด์ท้องถิ่นเบตง',
            emoji: '☁️',
            gradient: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-50'
        }
    };

    const currentPersona = personaId ? personas[personaId] : null;

    // Content Type Configuration
    const contentTypes = {
        caption: {
            title: 'คิดแคปชั่น',
            icon: MessageSquare,
            description: 'สร้างแคปชั่นโซเชียลมีเดียที่ดึงดูดใจ',
            gradient: 'from-blue-500 to-cyan-500',
            inputLabel: 'เล่าเกี่ยวกับโพสต์ของคุณ'
        },
        promotion: {
            title: 'เขียนโปรโมชั่น',
            icon: Tag,
            description: 'เขียนโปรโมชั่นที่กระตุ้นการซื้อ',
            gradient: 'from-pink-500 to-rose-500',
            inputLabel: 'บอกเกี่ยวกับโปรโมชั่นของคุณ'
        },
        video: {
            title: 'วางแผนวิดีโอ',
            icon: Video,
            description: 'วางแผนคลิปวิดีโอให้ปัง',
            gradient: 'from-purple-500 to-indigo-500',
            inputLabel: 'บอกหัวข้อวิดีโอที่ต้องการทำ'
        }
    };

    // RAG Context State
    const [ragContext, setRagContext] = useState(null);
    const [user, setUser] = useState(null);

    // Fetch User & RAG Data
    useEffect(() => {
        const loadUserData = async () => {
            const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());

            if (session?.user) {
                setUser(session.user);

                // Fetch Profile
                const { data: profile } = await import('@/lib/supabase').then(m => m.supabase
                    .from('profiles')
                    .select('business_name, business_type, description, signature_menu, history')
                    .eq('id', session.user.id)
                    .single());

                // Fetch Knowledge Base Docs
                const { data: docs } = await import('@/lib/supabase').then(m => m.supabase
                    .from('documents')
                    .select('filename, content')
                    .eq('user_id', session.user.id));

                if (profile || (docs && docs.length > 0)) {
                    setRagContext({
                        profile: profile || {},
                        documents: docs || []
                    });
                }
            }
        };
        loadUserData();
    }, []);

    // Handle voice transcript - just set the text, don't generate yet
    const handleTranscript = (text) => {
        console.log('📝 [handleTranscript] Received:', { text, length: text?.length });
        const trimmedText = text?.trim() || '';
        setTranscript(trimmedText);
        setGeneratedCaption(''); // Clear previous result
        console.log('✅ [handleTranscript] Set transcript:', trimmedText);
    };

    // Manual generate function - called when user clicks button
    const handleGenerate = async () => {
        if (!transcript.trim()) {
            setError('กรุณาพูดหรือพิมพ์ข้อความก่อน');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            await callGenerateAPI(transcript.trim());
        } catch (error) {
            console.error('Generation error:', error);
            setError('ไม่สามารถสร้างคอนเทนต์ได้ กรุณาลองใหม่อีกครั้ง');
            setIsGenerating(false);
        }
    };

    // Handle content refinement (shorten, lengthen, regenerate)
    const handleRefine = async (mode) => {
        if (!transcript) return;

        console.log(`🔧 [Refine] Mode: ${mode}`);
        setError('');
        setIsGenerating(true);

        try {
            await callGenerateAPI(transcript.trim(), mode);
        } catch (error) {
            console.error('Refinement error:', error);
            setError('ไม่สามารถปรับแต่งคอนเทนต์ได้ กรุณาลองใหม่อีกครั้ง');
            setIsGenerating(false);
        }
    };

    // Generate photo shooting tips based on content
    const generatePhotoTips = (contentType, content) => {
        const tips = {
            caption: [
                "📸 **มุมกล้อง:** ถ่ายในระดับสายตา (Eye Level) เพื่อให้ดูเป็นธรรมชาติ",
                "💡 **แสง:** ใช้แสงธรรมชาติจากหน้าต่าง หรือแสงนุ่มจากด้านข้าง (Side Light)",
                "🎨 **สี:** ใช้พื้นหลังสีเดียว (Solid Color) เพื่อไม่ให้รบกวนตัวสินค้า",
                "✨ **การจัดวาง:** ใช้กฎ 1/3 (Rule of Thirds) วางสินค้าไม่ให้อยู่ตรงกลางเสมอ",
                "🍽️ **Props:** เพิ่มของประกอบเล็กน้อย เช่น ใบไม้ ผ้าลินิน หรือช้อนส้อม"
            ],
            promotion: [
                "🏷️ **Focus:** ถ่ายให้เห็นป้ายโปรโมชั่นชัดเจน ใช้ Close-up",
                "👥 **คน:** เพิ่มคนในภาพเพื่อสร้าง Social Proof",
                "🎯 **ทำให้เด่น:** ใช้สีตัดกันเพื่อให้ข้อความโปรโมชั่นโดดเด่น",
                "📐 **สมดุล:** วางสินค้าและข้อความให้สมดุล ไม่แน่นเกินไป"
            ],
            video: [
                "🎬 **การเคลื่อนไหว:** ถ่ายกระบวนการทำให้เห็น (Process Shot)",
                "🎤 **เสียง:** ใช้ไมค์เสริมเพื่อคุณภาพเสียงที่ดี",
                "⏱️ **ความยาว:** เน้น 15-30 วินาทีแรก ต้องดึงดูดความสนใจ",
                "🖼️ **Thumbnail:** เลือกเฟรมที่น่าสนใจสุดเป็น Thumbnail"
            ]
        };

        return tips[contentType] || tips.caption;
    };

    // Call Gemini API to generate content
    const callGenerateAPI = async (userInput, refinementMode = null) => {
        try {
            // Convert uploaded images to base64
            const imageData = await Promise.all(
                uploadedImages.map(async (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const base64String = e.target.result.split(',')[1]; // Remove data URL prefix
                            console.log('📸 [Frontend] Image converted to base64:', {
                                fileName: file.name,
                                mimeType: file.type,
                                base64Length: base64String.length
                            });
                            resolve({
                                mimeType: file.type,
                                data: base64String
                            });
                        };
                        reader.onerror = (error) => {
                            console.error('❌ [Frontend] Failed to read image:', error);
                            reject(error);
                        };
                        reader.readAsDataURL(file);
                    });
                })
            );

            console.log('📤 [Frontend] Sending request to API:', {
                contentType,
                persona: personaId,
                hasImages: imageData.length > 0,
                imageCount: imageData.length,
                tone,
                targetAudience,
                refinementMode
            });

            const response = await fetch('/api/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contentType: contentType,
                    persona: personaId,
                    userInput: userInput,
                    tone: tone,
                    targetAudience: targetAudience,
                    refinementMode: refinementMode,
                    images: imageData.length > 0 ? imageData : undefined,
                    ragContext: ragContext // Pass RAG Data to API
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate content');
            }

            setGeneratedCaption(data.content);

            // Generate photo tips for this content
            const tips = generatePhotoTips(contentType, data.content);
            setPhotoTips(tips);

            setIsGenerating(false);
        } catch (error) {
            console.error('❌ API call failed:', error);
            throw error;
        }
    };

    const generateContent = (type, persona, input, images = []) => {
        const topic = input || 'สินค้าคุณภาพ';
        const hasImages = images.length > 0;
        const imageText = hasImages ? ' 📸 (ดูรูปภาพประกอบ)' : '';

        // Caption generators (เหมือนเดิม)
        const captionGenerators = {
            pa_meaw: (text) => `📣 หรอยจังฮู้! พี่น้องเห้อออ... วันนี้ป้าแมวมีเมนูเด็ดมานำเสนอ "${text}"${imageText} 🌶️✨

สูตรเด็ดจากยะลา เครื่องแกงตำมือ สดใหม่ทุกวัน! 
ใครได้กินรับรองว่าติดใจ "หรอยอย่างแรง" แน่นอน
ผักสดๆ ปลอดสารพิษ เก็บจากสวนหลังบ้านเราเอง 🥬🥒

แวะมาลองต๊ะ! ที่ร้านป้าแมว (ตลาดเมืองยะลา)
หรือสั่งเดลิเวอรี่กะได้ โทรเลย: 081-XXX-XXXX 🛵

#ป้าแมวข้าวยำ #ของหรอยยะลา #อาหารใต้ #หรอยจังฮู้ #${text.replace(/ /g, '')}`,

            kanah_batik: (text) => `✨ งดงาม เลอค่า... อัตลักษณ์แห่งรามัน

ขอนำเสนอผลงานใหม่ "${text}"${imageText} 🎨
ลายผ้าที่เขียนด้วยใจ ถ่ายทอดเรื่องราววิถีชีวิตชาวใต้ 
ผ่านปลายจันติ้งลงบนผืนผ้าไหมเนื้อดี...

เหมาะสำหรับสวมใส่ในวันสำคัญ หรือมอบเป็นของขวัญแก่ผู้ใหญ่ 🎁
งานทำมือชิ้นเดียวในโลก (Handmade 100%)

📍 สนใจชมสินค้าจริงได้ที่ กลุ่มบาติกกะนะห์ อ.รามัน
💬 สอบถามเพิ่มเติม Inbox มาได้เลยค่ะ

#บาติกรามัน #ผ้าคลุมไหล่ #งานฝีมือ #OTOPYala #${text.replace(/ /g, '')}`,

            betong_tour: (text) => `☁️ อัยเยอร์เวง... สวยตะโกน!! 📸

บังฮาริสพาเที่ยววันนี้ ขอแนะนำ "${text}"${imageText} 
จุดเช็คอินที่ใครมาเบตงต้องห้ามพลาด! บรรยากาศดีมากกกก 
ถ่ายรูปมุมไหนก็ปัง เหมือนอยู่เมืองนอกเลยครับพี่น้อง 😎

มาเบตงทั้งที ต้องเที่ยวให้สุด กินให้จุก!
ไก่เบตงก็มี ทะเลหมอกก็มา... ทริปนี้คุ้มแน่นอน!

🚗 จองทริป/สอบถามเส้นทาง ทักแชทบังมาได้เลย
พร้อมดูแลทุกคนเหมือนครอบครัวครับ ❤️

#เที่ยวเบตง #บังฮาริสพาเที่ยว #OKBetong #ยะลา #ทะเลหมอก #${text.replace(/ /g, '')}`
        };

        // Promotion generators
        const promotionGenerators = {
            pa_meaw: (text) => `🎉 โปรโมชั่นพิเศษจากป้าแมว!

📢 "${text}" ลดราคาพิเศษ!${imageText}

✨ สิทธิพิเศษสำหรับคุณ:
• ลดทันที 20% สำหรับเมนูที่ร่วมรายการ
• ซื้อ 2 แถม 1 ฟรี! (เมนูที่ 2 ราคาเท่ากันหรือต่ำกว่า)
• แถมน้ำพริกป้าแมวสูตรเด็ด ทุกออเดอร์!

📞 สั่งเลย: 081-XXX-XXXX
🛵 มีเดลิเวอรี่

⏰ โปรพิเศษนี้ ถึงสิ้นเดือนเท่านั้น!
#โปรป้าแมว #ของหรอยยะลา #ลดราคา`,

            kanah_batik: (text) => `✨ โปรโมชั่นพิเศษ! ผ้าบาติกกะนะห์

🎨 "${text}" ราคาพิเศษเฉพาะเดือนนี้!${imageText}

💝 สิทธิพิเศษ:
• ลด 15% สำหรับผ้าบาติกทุกลาย
• ฟรี! กล่องของขวัญสวยงาม
• รับประกันสีไม่ตก คุณภาพ 100%

📍 สั่งได้ที่ กลุ่มบาติกกะนะห์ อ.รามัน
💬 Inb ox เพื่อรับส่วนลด

*เงื่อนไข: ใช้ได้ถึงสิ้นเดือน / สั่งขั้นต่ำ 1 ผืน
#โปรบาติก #ผ้าบาติกลดราคา #OTOPYala`,

            betong_tour: (text) => `🎊 โปรทัวร์เบตงสุดพิเศษ!

☁️ "${text}" แพ็คเกจพิเศษ ราคาโดนใจ!${imageText}

🚗 โปรโมชั่นสุดคุ้ม:
• ลดทันที 20% สำหรับกรุ๊ป 4 คนขึ้นไป
• ฟรี! ไก่เบตง 1 ตัว/ทริป
• รวมประกันเดินทาง

✅ รวม: รถ + ที่พัก + มัคคุเทศก์
📞 โทร/Line: @bangharis_tour

⏰ จองภายในเดือนนี้ รับส่วนลดเพิ่ม 500 บาท!
#โปรทัวร์เบตง #เที่ยวเบตง #ทะเลหมอก`
        };

        // Video plan generators
        const videoGenerators = {
            pa_meaw: (text) => `🎬 แผนวิดีโอ: "${text}"

📝 คำอธิบาย:
มาดูวิธีทำ "${text}" สูตรเด็ดจากป้าแมว! เครื่องแกงตำมือ รสจัดจ้าน หอมกลิ่นเครื่องเทศภาคใต้ ทำง่าย อร่อยแน่นอน! 🌶️

🎥 วิธีการถ่ายทำ:
📍 Scene 1: เปิดฉากด้วยการแนะนำตัวและวัตถุดิบ (30 วินาที)
   - ถ่ายมุมสูง โชว์เครื่องแกงทั้งหมด
   
📍 Scene 2: ขั้นตอนการทำ (2-3 นาที)
   - Close-up การตำเครื่องแกง
   - Time-lapse หั่นผัก
   - ลงมือทำทีละขั้นตอน
   
📍 Scene 3: Reveal อาหารสำเร็จรูป (30 วินาที)
   - จัดจาน ถ่ายมุมสวยๆ
   - ชิมและแสดงความอร่อย

💬 บทพูด:
"สวัสดีค่ะพี่น้อง! วันนี้ป้าแมวจะมาสอนทำ ${text} สูตรเด็ดจากยะลา กันนะ หรอยอย่างแรงเลยล่ะ!

[ระหว่างทำ] เครื่องแกงต้องตำให้ละเอียด กลิ่นจึงจะออกเต็มที่... ผักต้องสดใหม่นะคะ...

[ตอนจบ] เป็นยังไงบ้างคะ ง่ายมั้ย? ลองทำตามกันดูนะคะ รับรองอร่อยแน่นอน!"

#️⃣ Hashtags แนะนำ:
#${text.replace(/ /g, '')} #อาหารใต้ #สูตรป้าแมว #ข้าวยำยะลา #หรอยจังฮู้ #ทำอาหาร #เมนูไทย`,

            kanah_batik: (text) => `🎬 แผนวิดีโอ: "${text}"

📝 คำอธิบาย:
ชมกระบวนการสร้างสรรค์ผ้าบาติก "${text}" ด้วยมือจากช่างฝีมือท้องถิ่น งานละเอียด ลวดลายสวยงาม เต็มไปด้วยเรื่องราววัฒนธรรมใต้ 🎨

🎥 วิธีการถ่ายทำ:
📍 Scene 1: แนะนำลายผ้าและความหมาย (30 วินาที)
   - ถ่ายผ้าที่สำเร็จแล้วในมุมสวย
   
📍 Scene 2: กระบวนการทำบาติก (2-3 นาที)
   - Time-lapse การวาดลายด้วยจันติ้ง
   - การย้อมสี ขั้นตอนละเอียด
   - แสดงความพิถีพิถันในงาน
   
📍 Scene 3: ผลงานสำเร็จและการใช้งาน (30 วินาที)
   - โชว์ผืนผ้าสวยๆ
   - สาธิตการพับ/สวมใส่

💬 บทพูด:
"สวัสดีค่ะ วันนี้กะนะห์จะพาทุกคนมาดูกระบวนการสร้าง ${text} ลายผ้าบาติกที่เต็มไปด้วยอัตลักษณ์ชาวใต้กันค่ะ

[ระหว่างทำ] แต่ละเส้น แต่ละลาย ล้วนถ่ายทอดเรื่องราว... ต้องใช้ความพิถีพิถัน...

[ตอนจบ] นี่คือผืนผ้าที่เกิดจากหัวใจและฝีมือ ชิ้นเดียวในโลกค่ะ"

#️⃣ Hashtags แนะนำ:
#บาติกรามัน #ผ้าบาติก #งานฝีมือ #OTOP #วัฒนธรรมไทย #ผ้าทอมือ #${text.replace(/ /g, '')}`,

            betong_tour: (text) => `🎬 แผนวิดีโอ: "${text}"

📝 คำอธิบาย:
พาเที่ยวเบตงกับบังฮาริส! ไปสัมผัสความงดงามของ "${text}" บรรยากาศสุดปัง ถ่ายรูปสวย มุมไหนก็งาม เหมือนอยู่เมืองนอกเลยครับ! ☁️

🎥 วิธีการถ่ายทำ:
📍 Scene 1: เปิดฉากที่จุดหมาย (30 วินาที)
   - Drone shot แสดงวิว panorama
   - มุมกว้างโชว์บรรยากาศ
   
📍 Scene 2: พาชมรอบๆ (2-3 นาที)
   - B-roll ทิวทัศน์สวยๆ
   - จุดถ่ายรูปสำคัญ
   - กิจกรรมที่น่าสนใจ
   
📍 Scene 3: สรุปและ call to action (30 วินาที)
   - แนะนำเคล็ดลับการเที่ยว
   - ชวนมาเที่ยวด้วยกัน

💬 บทพูด:
"อัยเยอร์เวง พี่น้องครับ! วันนี้บังฮาริสพามาที่ ${text} สถานที่สุดปังที่ใครมาเบตงต้องห้ามพลาด!

[ระหว่างเที่ยว] ดูสิครับ วิวสวยแบบนี้... ถ่ายรูปมุมไหนก็ปัง... บรรยากาศดีมากกกก

[ตอนจับ] เป็นยังไงบ้างครับ สวยใช่มั้ย? อยากมาเองแล้วใช่มั้ย? ติดต่อบังได้เลยครับ!"

#️⃣ Hashtags แนะนำ:
#เที่ยวเบตง #${text.replace(/ /g, '')} #บังฮาริสพาเที่ยว #ทะเลหมอก #เที่ยวไทย #ยะลา #OKBetong`
        };

        // Default templates
        const defaultCaption = (text) => `✨ สร้างคอนเทนต์สุดปังสำหรับ: "${text}"${imageText}

🔥 ห้ามพลาด! กับ ${text} ที่ดีที่สุดที่เราคัดสรรมาเพื่อคุณ
คุณภาพจัดเต็ม ราคาโดนใจ ตอบโจทย์ทุกความต้องการ

✅ สินค้าพร้อมส่ง
✅ มีบริการเก็บเงินปลายทาง
✅ รับประกันความพึงพอใจ

📩 สนใจทักแชท หรือพิมพ์ "สนใจ" ใต้โพสต์ได้เลย!
#สินค้าแนะนำ #โปรโมชั่น #คุณภาพดี #${text.replace(/ /g, '')}`;

        const defaultPromotion = (text) => `🎉 โปรโมชั่นพิเศษ!

🔥 "${text}" ลดราคาสุดคุ้ม!${imageText}

✨ สิทธิพิเศษสำหรับคุณ:
• ลดทันที 20%
• ฟรีค่าจัดส่ง
• รับประกันคุณภาพ 100%

📞 สั่งเลยวันนี้: Line @yourshop
🚚 จัดส่งฟรีทั่วไทย

⏰ โปรนี้มีจำนวนจำกัด รีบจองเลย!
#โปรโมชั่น #ลดราคา #ของดีราคาดี`;

        const defaultVideo = (text) => `🎬 แผนวิดีโอ: "${text}"

📝 คำอธิบาย:
เรื่องราวน่าสนใจเกี่ยวกับ "${text}" ที่คุณไม่ควรพลาด! เต็มไปด้วยเนื้อหาที่มีประโยชน์และความบันเทิง

🎥 วิธีการถ่ายทำ:
📍 Scene 1: เปิดฉาก Hook ดึงดูดความสนใจ (15 วินาที)
📍 Scene 2: เนื้อหาหลัก Value content (2-3 นาที)
📍 Scene 3: สรุปและ CTA (30 วินาที)

💬 บทพูด:
"สวัสดีครับทุกคน! วันนี้เรามาพูดถึง ${text} กันครับ...
[เนื้อหาหลัก]
...ถ้าชอบอย่าลืมกด Like Share Subscribe ด้วยนะครับ!"

#️⃣ Hashtags:
#${text.replace(/ /g, '')} #เนื้อหาดีๆ #ติดตามต่อ`;

        // Select appropriate generator based on type
        if (type === 'caption') {
            const generator = captionGenerators[persona] || defaultCaption;
            return generator(topic);
        } else if (type === 'promotion') {
            const generator = promotionGenerators[persona] || defaultPromotion;
            return generator(topic);
        } else if (type === 'video') {
            const generator = videoGenerators[persona] || defaultVideo;
            return generator(topic);
        }

        return defaultCaption(topic);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCaption);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <>
            <Navbar />

            <main className={`min-h-screen pt-24 pb-16 bg-gradient-to-b from-green-50 to-white`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Persona Banner - แสดงเมื่อมี Persona */}
                    {currentPersona && (
                        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
                            <div className={`p-1 rounded-2xl bg-gradient-to-r ${currentPersona.gradient} shadow-lg`}>
                                <div className="bg-white rounded-xl p-6 flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${currentPersona.bg}`}>
                                        {currentPersona.emoji}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Demo Mode</span>
                                            <span className="text-sm text-gray-500 font-medium">กำลังสวมบทบาท:</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">{currentPersona.name}</h2>
                                        <p className="text-gray-500">{currentPersona.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Page Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Magic Studio <span className="text-green-600">.</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            ระบบ AI อัจฉริยะที่จะเปลี่ยน "คำพูด" ของคุณ <br className="hidden sm:block" />
                            ให้เป็นโพสต์ขายของมืออาชีพ ในปุ่มเดียว
                        </p>
                    </div>

                    {/* Main Input Area */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">

                        {/* Decorative Background Pattern */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>

                        <div className="p-8 sm:p-12">
                            {/* Content Type Selection */}
                            <div className="mb-10">
                                <div className="mb-6 text-center">
                                    <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-700 text-sm font-bold mb-4">
                                        ขั้นตอนที่ 1
                                    </span>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        เลือกประเภทคอนเทนต์ที่ต้องการ
                                    </h3>
                                    <p className="text-gray-500">
                                        เลือกว่าต้องการสร้างคอนเทนต์แบบไหน
                                    </p>
                                </div>

                                {/* Content Type Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(contentTypes).map(([key, config]) => (
                                        <ContentTypeCard
                                            key={key}
                                            type={key}
                                            title={config.title}
                                            icon={config.icon}
                                            description={config.description}
                                            gradient={config.gradient}
                                            isSelected={contentType === key}
                                            onClick={setContentType}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="relative my-10">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-400 font-medium uppercase tracking-widest">
                                        จากนั้น
                                    </span>
                                </div>
                            </div>

                            {/* Voice Input Section */}
                            <div className="flex flex-col items-center justify-center mb-10">
                                <div className="mb-6 text-center">
                                    <span className="inline-block py-1 px-3 rounded-full bg-green-100 text-green-700 text-sm font-bold mb-4">
                                        ขั้นตอนที่ 2
                                    </span>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {contentTypes[contentType].inputLabel}
                                    </h3>
                                    <p className="text-gray-500 mt-2">
                                        {contentType === 'caption' && 'เช่น "วันนี้มีแกงไตปลา รสจัดจ้าน"'}
                                        {contentType === 'promotion' && 'เช่น "ลดราคา 50% สำหรับเมนูยำทะเล"'}
                                        {contentType === 'video' && 'เช่น "สอนทำข้าวยำสูตรป้าแมว"'}
                                    </p>
                                </div>

                                <VoiceInput onTranscript={handleTranscript} />
                            </div>

                            {/* Divider with Text */}
                            <div className="relative my-10">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-400 font-medium uppercase tracking-widest">
                                        หรือ อัปโหลดรูปภาพ
                                    </span>
                                </div>
                            </div>

                            {/* Image Upload Component */}
                            <ImageUpload
                                onImagesChange={setUploadedImages}
                                maxImages={3}
                                maxSizeMB={10}
                            />



                            {/* Editable Transcript / Input Field */}
                            {transcript && !isGenerating && !generatedCaption && (
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ✏️ ตรวจสอบและแก้ไขข้อความ (ถ้าต้องการ):
                                    </label>
                                    <textarea
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px] resize-y"
                                        placeholder="พิมพ์หรือแก้ไขข้อความที่นี่..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 คุณสามารถแก้ไขข้อความได้ หากระบบแปลงเสียงผิด
                                    </p>
                                </div>
                            )}

                            {/* Tone and Audience Selection - shown when there's transcript */}
                            {transcript && !isGenerating && !generatedCaption && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Tone Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🎨 โทนการเขียน:
                                        </label>
                                        <select
                                            value={tone}
                                            onChange={(e) => setTone(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="casual">😊 เป็นกันเอง สบายๆ</option>
                                            <option value="professional">💼 เป็นทางการ มืออาชีพ</option>
                                            <option value="playful">🎉 สนุกสนาน ขี้เล่น</option>
                                            <option value="warm">🤗 อบอุ่น เป็นกัลยาณมิตร</option>
                                            <option value="energetic">⚡ มีพลัง กระตือรือร้น</option>
                                        </select>
                                    </div>

                                    {/* Target Audience Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            👥 กลุ่มเป้าหมาย:
                                        </label>
                                        <select
                                            value={targetAudience}
                                            onChange={(e) => setTargetAudience(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="general">👨‍👩‍👧‍👦 คนทั่วไป (ทุกกลุ่ม)</option>
                                            <option value="teens">🎮 วัยรุ่น Gen Z (13-24 ปี)</option>
                                            <option value="adults">💼 ผู้ใหญ่วัยทำงาน (25-45 ปี)</option>
                                            <option value="seniors">👴 ผู้สูงอายุ (45+ ปี)</option>
                                            <option value="parents">👨‍👩‍👧 พ่อแม่ ครอบครัว</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Generate Button - shown when there's transcript */}
                            {transcript && !isGenerating && !generatedCaption && (
                                <div className="mt-6 text-center">
                                    <Button
                                        onClick={handleGenerate}
                                        className="px-8 py-4 text-lg"
                                    >
                                        <Sparkles className="w-6 h-6 mr-2" />
                                        🪄 สร้างคอนเทนต์
                                    </Button>
                                    {uploadedImages.length > 0 && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            📸 พร้อมรูปภาพ {uploadedImages.length} รูป
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="mt-8 space-y-6">
                        {/* 1. Transcript Bubble */}
                        {transcript && !isGenerating && !generatedCaption && (
                            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 flex gap-4 items-start max-w-2xl mx-auto">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-lg">👤</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1 font-bold">คุณพูดว่า:</p>
                                    <p className="text-gray-900 text-lg">"{transcript}"</p>
                                </div>
                            </div>
                        )}

                        {/* 2. Loading State */}
                        {isGenerating && (
                            <div className="text-center py-12 animate-pulse">
                                <div className="inline-block relative">
                                    <Sparkles className="w-16 h-16 text-green-500 animate-spin-slow" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-ping"></div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mt-6">AI กำลังร่ายมนตร์...</h3>
                                <p className="text-gray-500">กำลังเลือกคำศัพท์ภาษาถิ่นที่โดนใจ</p>
                            </div>
                        )}

                        {/* 3. Generated Result */}
                        {generatedCaption && !isGenerating && (
                            <div className="animate-in zoom-in-95 duration-500 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden ring-4 ring-green-50">
                                <div className="bg-green-600 p-4 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <MessageSquareQuote className="w-6 h-6" />
                                        <span className="font-bold text-lg">แคปชั่นพร้อมโพสต์</span>
                                    </div>
                                    <span className="text-xs bg-green-700 px-2 py-1 rounded text-green-100">AI Generated</span>
                                </div>

                                <div className="p-8">
                                    <div className="prose prose-lg max-w-none text-gray-800 whitespace-pre-line leading-relaxed font-sans">
                                        {generatedCaption}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-3">
                                    <Button
                                        onClick={handleCopy}
                                        className={`flex-1 flex items-center justify-center gap-2 transition-all ${isCopied ? 'bg-green-800' : ''}`}
                                    >
                                        {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        {isCopied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกข้อความ'}
                                    </Button>
                                </div>

                                {/* Refinement Controls */}
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        🎯 ปรับแต่งเนื้อหา
                                    </h3>

                                    {/* Quick Action Buttons */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleRefine('shorten')}
                                            className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 border border-gray-200"
                                            disabled={isGenerating}
                                        >
                                            📏 กระชับขึ้น
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleRefine('lengthen')}
                                            className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 border border-gray-200"
                                            disabled={isGenerating}
                                        >
                                            📝 ยาวขึ้น
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleRefine('regenerate')}
                                            className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 border border-gray-200"
                                            disabled={isGenerating}
                                        >
                                            🔄 สร้างใหม่
                                        </Button>
                                    </div>

                                    {/* Photo Tips Section */}
                                    {photoTips.length > 0 && (
                                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 shadow-sm">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                📸 คำแนะนำการถ่ายภาพสำหรับคอนเทนต์นี้
                                            </h3>
                                            <ul className="space-y-3">
                                                {photoTips.map((tip, index) => (
                                                    <li key={index} className="text-sm text-gray-700 leading-relaxed">
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="text-xs text-gray-500 mt-4">
                                                💡 ใช้เทคนิคเหล่านี้เพื่อถ่ายภาพที่เข้ากับคอนเทนต์ของคุณได้อย่างสมบูรณ์แบบ
                                            </p>
                                        </div>
                                    )}

                                    {/* Copy Button */}
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedCaption);
                                            alert('📋 คัดลอกคอนเทนต์เรียบร้อยแล้ว!');
                                        }}
                                        variant="primary"
                                        className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all"
                                    >
                                        📋 คัดลอกคอนเทนต์
                                    </Button>

                                    {/* Change Tone and Audience */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                เปลี่ยนโทน:
                                            </label>
                                            <select
                                                value={tone}
                                                onChange={(e) => setTone(e.target.value)}
                                                disabled={isGenerating}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50"
                                            >
                                                <option value="casual">😊 สบาย ๆ</option>
                                                <option value="professional">💼 เป็นทางการ</option>
                                                <option value="playful">🎉 สนุกสนาน</option>
                                                <option value="friendly">🤗 เป็นกันเอง</option>
                                                <option value="excited">🔥 ตื่นเต้น</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                เป้าหมาย:
                                            </label>
                                            <select
                                                value={targetAudience}
                                                onChange={(e) => setTargetAudience(e.target.value)}
                                                disabled={isGenerating}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50"
                                            >
                                                <option value="general">👨‍👩‍👧‍👦 ทุกกลุ่ม</option>
                                                <option value="teens">🎮 วัยรุ่น</option>
                                                <option value="adults">💼 ผู้ใหญ่</option>
                                                <option value="seniors">👴 ผู้สูงอายุ</option>
                                                <option value="parents">👨‍👩‍👧 ครอบครัว</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 border-t border-gray-100">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setTranscript('');
                                            setGeneratedCaption('');
                                            setUploadedImages([]);
                                        }}
                                    >
                                        เริ่มใหม่
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Images - Before/After Display */}

                </div>
            </main>

            <Footer />
        </>
    );
}