'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import { Loader2, Save, FileText, Plus, Trash2, LogOut } from 'lucide-react';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const router = useRouter();

    // Profile State
    const [profile, setProfile] = useState({
        business_name: '',
        business_type: '',
        description: '',
        signature_menu: '',
        history: ''
    });

    // Knowledge Base State
    const [documents, setDocuments] = useState([]);
    const [newDocMode, setNewDocMode] = useState(false);
    const [newDoc, setNewDoc] = useState({ title: '', content: '' });

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                router.push('/login');
                return;
            }

            setUser(user);

            // Fetch Profile
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn(error);
            }

            if (data) {
                setProfile({
                    business_name: data.business_name || '',
                    business_type: data.business_type || '',
                    description: data.description || '',
                    signature_menu: data.signature_menu || '',
                    history: data.history || ''
                });
            }

            // Fetch Documents
            const { data: docs, error: docError } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (docs) setDocuments(docs);

        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setSaving(true);
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                ...profile,
                updated_at: new Date().toISOString(),
            });

            if (error) throw error;
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const addDocument = async () => {
        if (!newDoc.title || !newDoc.content) return;

        try {
            const { error } = await supabase.from('documents').insert({
                user_id: user.id,
                filename: newDoc.title,
                content: newDoc.content,
                file_type: 'text'
            });

            if (error) throw error;

            setNewDocMode(false);
            setNewDoc({ title: '', content: '' });
            getProfile(); // Refresh list
        } catch (error) {
            alert('Error adding document: ' + error.message);
        }
    };

    const deleteDocument = async (id) => {
        if (!confirm('ยืนยันการลบข้อมูลนี้?')) return;

        try {
            const { error } = await supabase.from('documents').delete().eq('id', id);
            if (error) throw error;
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            alert('Error deleting: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            <main className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">จัดการข้อมูลร้าน</h1>
                        <p className="text-gray-500 mt-1">ข้อมูลเหล่านี้จะถูกใช้เป็น "ความรู้พื้นฐาน" ให้ AI สร้างคอนเทนต์ได้แม่นยำขึ้น</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" />
                        ออกจากระบบ
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Business Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                🏪 ข้อมูลธุรกิจ
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อร้าน / ธุรกิจ</label>
                                        <input
                                            type="text"
                                            value={profile.business_name}
                                            onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="เช่น ร้านข้าวยำปักษ์ใต้ ป้าแมว"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทธุรกิจ</label>
                                        <input
                                            type="text"
                                            value={profile.business_type}
                                            onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="เช่น อาหาร, เสื้อผ้า, ท่องเที่ยว"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เกี่ยวกับร้าน (สั้นๆ)</label>
                                    <textarea
                                        value={profile.description}
                                        onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="จุดเด่นของร้านคืออะไร..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เมนูเด็ด / สินค้าแนะนำ</label>
                                    <textarea
                                        value={profile.signature_menu}
                                        onChange={(e) => setProfile({ ...profile, signature_menu: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="รายการสินค้าที่ขายดี..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำนาน / ประวัติร้าน (Story)</label>
                                    <textarea
                                        value={profile.history}
                                        onChange={(e) => setProfile({ ...profile, history: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="เรื่องราวความเป็นมาที่น่าสนใจ..."
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button onClick={updateProfile} disabled={saving} className="w-full md:w-auto">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        บันทึกข้อมูล
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Knowledge Base */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    📚 คลังความรู้ (RAG)
                                </h2>
                                <Button size="sm" variant="secondary" onClick={() => setNewDocMode(!newDocMode)}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                เพิ่มข้อมูลเจาะลึก เช่น สูตรอาหารลับ, รายละเอียดโปรโมชั่นประจำเดือน, หรือข้อมูลสินค้า เพื่อให้ AI นำไปใช้
                            </p>

                            {newDocMode && (
                                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 animate-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        value={newDoc.title}
                                        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                                        className="w-full mb-2 px-3 py-2 border border-green-200 rounded-lg text-sm"
                                        placeholder="หัวข้อ (เช่น โปรโมชั่นเดือนมกรา)"
                                    />
                                    <textarea
                                        value={newDoc.content}
                                        onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                                        className="w-full mb-2 px-3 py-2 border border-green-200 rounded-lg text-sm"
                                        rows={4}
                                        placeholder="วางเนื้อหาข้อมูลที่นี่..."
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setNewDocMode(false)}>ยกเลิก</Button>
                                        <Button size="sm" onClick={addDocument}>เพิ่มข้อมูล</Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {documents.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                        ยังไม่มีข้อมูลเพิ่มเติม
                                    </div>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 transition-colors group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-white rounded-lg text-green-600">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 text-sm">{doc.filename}</h4>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{doc.content}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteDocument(doc.id)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
