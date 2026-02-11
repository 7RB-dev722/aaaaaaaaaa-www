import React from 'react';
import { MessageCircle, Zap, KeyRound, Image as ImageIcon } from 'lucide-react';
import { SectionWrapper, InputField } from './SettingsComponents';

interface DiscordSettingsProps {
    settings: Record<string, string>;
    onSettingsChange: (newSettings: Record<string, string>) => void;
}

export const DiscordSettings: React.FC<DiscordSettingsProps> = ({ settings, onSettingsChange }) => {
    const handleChange = (key: string, value: string) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <SectionWrapper title="إعدادات إشعارات ديسكورد" icon={MessageCircle}>
            <div className="space-y-6">
                {/* Bot Configuration */}
                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">إعدادات البوت (Bot Configuration)</h4>
                            <p className="text-xs text-gray-400">إعدادات الاتصال الأساسية مع ديسكورد</p>
                        </div>
                    </div>

                    <InputField 
                        label="توكن البوت (Bot Token)" 
                        value={settings.discord_bot_token} 
                        onChange={(val) => handleChange('discord_bot_token', val)} 
                        placeholder="MTA..." 
                    />
                    <div className="h-4"></div>
                    <InputField 
                        label="رابط صورة البوت (Bot Avatar URL)" 
                        value={settings.discord_bot_avatar_url} 
                        onChange={(val) => handleChange('discord_bot_avatar_url', val)} 
                        placeholder="https://example.com/logo.png" 
                    />
                </div>

                {/* Standard Notification (Order Created) */}
                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold">إشعار عند إنشاء طلب (Order Created)</h4>
                                <p className="text-xs text-gray-400">يتم إرساله عند تعبئة العميل للبيانات في صفحة الدفع</p>
                            </div>
                        </div>
                        
                        <InputField 
                            label="Webhook URL (Order Created)" 
                            value={settings.discord_webhook_url} 
                            onChange={(val) => handleChange('discord_webhook_url', val)} 
                            placeholder="https://discord.com/api/webhooks/..." 
                        />
                        <div className="h-4"></div>
                        <InputField 
                            label="User ID to Mention" 
                            value={settings.discord_admin_id} 
                            onChange={(val) => handleChange('discord_admin_id', val)} 
                            placeholder="Discord User ID" 
                        />
                </div>

                {/* Paid Notification (I Have Paid) */}
                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center text-green-400">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold">إشعار عند تأكيد الدفع (I Have Paid)</h4>
                                <p className="text-xs text-gray-400">يتم إرساله عند ضغط العميل على زر 'لقد دفعت'</p>
                            </div>
                        </div>
                        
                        <InputField 
                            label="Webhook URL (Paid)" 
                            value={settings.discord_webhook_url_paid} 
                            onChange={(val) => handleChange('discord_webhook_url_paid', val)} 
                            placeholder="https://discord.com/api/webhooks/..." 
                        />
                        <div className="h-4"></div>
                        <InputField 
                            label="User ID to Mention (Paid)" 
                            value={settings.discord_paid_admin_id} 
                            onChange={(val) => handleChange('discord_paid_admin_id', val)} 
                            placeholder="Discord User ID" 
                        />
                </div>

                {/* Special Notifications (Additional) */}
                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold">إشعارات إضافية (اختياري)</h4>
                                <p className="text-xs text-gray-400">وجهات إضافية لإشعار 'لقد دفعت'</p>
                            </div>
                        </div>
                        
                        {/* Special 1 */}
                        <div className="mb-6 p-3 bg-black/20 rounded-lg border border-white/5">
                            <h5 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px]">1</span>
                                الوجهة الأولى
                            </h5>
                            <InputField 
                                label="Webhook URL" 
                                value={settings.special_discord_webhook_url_1} 
                                onChange={(val) => handleChange('special_discord_webhook_url_1', val)} 
                            />
                            <div className="h-2"></div>
                            <InputField 
                                label="User ID" 
                                value={settings.special_discord_user_id_1} 
                                onChange={(val) => handleChange('special_discord_user_id_1', val)} 
                            />
                        </div>

                        {/* Special 2 */}
                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                            <h5 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px]">2</span>
                                الوجهة الثانية
                            </h5>
                            <InputField 
                                label="Webhook URL" 
                                value={settings.special_discord_webhook_url_2} 
                                onChange={(val) => handleChange('special_discord_webhook_url_2', val)} 
                            />
                            <div className="h-2"></div>
                            <InputField 
                                label="User ID" 
                                value={settings.special_discord_user_id_2} 
                                onChange={(val) => handleChange('special_discord_user_id_2', val)} 
                            />
                        </div>
                </div>
            </div>
        </SectionWrapper>
    );
};
