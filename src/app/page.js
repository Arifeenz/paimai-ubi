import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import PersonaCard from '@/components/PersonaCard';
import PricingCard from '@/components/PricingCard';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const personas = [
    {
      name: 'ป้าแมว',
      business: 'ข้าวยำ',
      location: 'ยะลา',
      emoji: '🍚',
      personaId: 'pa_meaw',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      name: 'กะนะห์',
      business: 'ผ้าบาติก OTOP',
      location: 'รามัน',
      emoji: '🎨',
      personaId: 'kanah',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'บังฮาริส',
      business: 'ท่องเที่ยวเบตง',
      location: 'เบตง Skywalk',
      emoji: '🏔️',
      personaId: 'haris',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: 0,
      features: [
        'สร้างคอนเทนต์ได้ 10 ครั้ง/เดือน',
        'ใช้งานผ่านเว็บไซต์',
        'เทมเพลตพื้นฐาน'
      ]
    },
    {
      name: 'Standard',
      price: 290,
      isBestSeller: true,
      features: [
        'สร้างคอนเทนต์ไม่จำกัด',
        'ใช้งานผ่านเว็บและมือถือ',
        'เทมเพลตครบทุกรูปแบบ',
        'ปรับแต่งด้วย AI ขั้นสูง',
        'รองรับภาษาถิ่นทุกภูมิภาค'
      ]
    },
    {
      name: 'Pro',
      price: 590,
      features: [
        'ทุกฟีเจอร์ใน Standard',
        'วิเคราะห์ประสิทธิภาพคอนเทนต์',
        'แนะนำเวลาโพสต์ที่ดีที่สุด',
        'บริการปรึกษาจากผู้เชี่ยวชาญ',
        'สร้างแบรนด์เอกลักษณ์ส่วนตัว'
      ]
    }
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 bg-gradient-to-b from-green-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI ที่เข้าใจวัฒนธรรมไทย</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                สร้างคอนเทนต์อัตลักษณ์ท้องถิ่น<br />
                <span className="text-green-600">ได้ในปุ่มเดียว</span>
              </h1>

              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
                AI ผู้ช่วยผู้ประกอบการชุมชน<br />
                ถ่ายรูปปุ๊บ เขียนแคปชั่นปั๊บ
              </p>

              <Link href="/magic">
                <Button className="text-lg px-8 py-4">
                  ทดลองสร้างคอนเทนต์ฟรี 🎯
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Partner Showcase */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                เพื่อนร่วมทาง PaiMai
              </h2>
              <p className="text-lg text-gray-600">
                ผู้ประกอบการชุมชนที่ไว้วางใจเรา
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {personas.map((persona) => (
                <PersonaCard key={persona.personaId} {...persona} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                แพ็กเกจที่เหมาะกับคุณ
              </h2>
              <p className="text-lg text-gray-600">
                เริ่มต้นฟรี อัปเกรดได้ทุกเมื่อ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan) => (
                <PricingCard key={plan.name} {...plan} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
