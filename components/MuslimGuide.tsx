import React, { useState, Fragment } from 'react';
import { generateTravelGuide } from '../services/geminiService';
import { TravelGuideResponse } from '../types';
import { GuideIcon } from './icons/GuideIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { CarIcon } from './icons/CarIcon';
import { InfoIcon } from './icons/InfoIcon';
import { PriceIcon } from './icons/PriceIcon';
import { EmergencyIcon } from './icons/EmergencyIcon';
import { EtiquetteIcon } from './icons/EtiquetteIcon';
import { MosqueIcon } from './icons/MosqueIcon';

const TravelerGuide: React.FC = () => {
    const [location, setLocation] = useState<string>('');
    const [guide, setGuide] = useState<TravelGuideResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [openSection, setOpenSection] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!location.trim()) return;
        setIsLoading(true);
        setError(null);
        setGuide(null);
        try {
            const result = await generateTravelGuide(location);
            setGuide(result);
            setOpenSection('locationInfo'); // Open the first section by default
        } catch (err) {
            console.error(err);
            setError(`حدث خطأ أثناء إنشاء الدليل لـ "${location}". يرجى المحاولة مرة أخرى.`);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const Section: React.FC<{ title: string; id: string; Icon: React.FC<any>; children: React.ReactNode }> = ({ title, id, Icon, children }) => (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => toggleSection(id)}
                className="w-full flex justify-between items-center p-4 text-right hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-emerald-500" />
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSection === id ? 'rotate-180' : ''}`} />
            </button>
            {openSection === id && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );

    const renderGuide = (data: TravelGuideResponse) => (
        <div className="mt-8 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
                    دليلك إلى <span className="text-emerald-500">{data.locationInfo.city}, {data.locationInfo.country}</span>
                </h3>
            </div>
            <Section title="نظرة عامة" id="locationInfo" Icon={InfoIcon}>
                <p>{data.locationInfo.generalDescription}</p>
            </Section>
            {data.entryRequirements && <Section title="متطلبات الدخول" id="entry" Icon={CheckBadgeIcon}>
                <h4 className="font-semibold">معلومات التأشيرة</h4>
                <p className="mb-3">{data.entryRequirements.visaInfo}</p>
                {data.entryRequirements.customsNotes && <>
                    <h4 className="font-semibold">ملاحظات الجمارك</h4>
                    <ul className="list-disc list-inside mt-1">{data.entryRequirements.customsNotes.map((note, i) => <li key={i}>{note}</li>)}</ul>
                </>}
            </Section>}
            <Section title="التنقل" id="transport" Icon={CarIcon}>
                <h4 className="font-semibold">النقل العام</h4>
                <p className="mb-3">{data.gettingAround.publicTransport}</p>
                {data.gettingAround.taxisRideSharing && <><h4 className="font-semibold">سيارات الأجرة والتطبيقات</h4><p className="mb-3">{data.gettingAround.taxisRideSharing}</p></>}
                {data.gettingAround.carRental && <><h4 className="font-semibold">تأجير السيارات</h4><p>{data.gettingAround.carRental}</p></>}
            </Section>
             <Section title="المال والاتصالات" id="money" Icon={PriceIcon}>
                <h4 className="font-semibold">العملة</h4>
                <p className="mb-3">{data.money.currency}</p>
                <h4 className="font-semibold">ثقافة البقشيش</h4>
                <p className="mb-3">{data.money.tippingCulture}</p>
                 {data.money.budgetTips && <>
                    <h4 className="font-semibold">نصائح للميزانية</h4>
                    <ul className="list-disc list-inside mt-1">{data.money.budgetTips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                </>}
                <h4 className="font-semibold mt-4">الاتصال بالإنترنت</h4>
                <p className="mb-3">{data.connectivity.simCards}</p>
                {data.connectivity.wifi && <p>{data.connectivity.wifi}</p>}
            </Section>
             <Section title="الصحة والسلامة" id="safety" Icon={EmergencyIcon}>
                <h4 className="font-semibold">أرقام الطوارئ</h4>
                <div className="my-2 space-y-2">
                    {data.healthAndSafety.emergencyContacts.map(c => (
                        <div key={c.service} className="p-2 flex justify-between items-center bg-gray-100 dark:bg-gray-700 rounded-md">
                            <span>{c.service} {c.note && `(${c.note})`}</span>
                            <a href={`tel:${c.number}`} className="font-bold text-red-500 tracking-wider">{c.number}</a>
                        </div>
                    ))}
                </div>
                 <h4 className="font-semibold mt-4">نصائح صحية</h4>
                 <ul className="list-disc list-inside mt-1 mb-3">{data.healthAndSafety.healthTips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                  {data.healthAndSafety.safetyNotes && <>
                    <h4 className="font-semibold">نصائح للسلامة</h4>
                    <ul className="list-disc list-inside mt-1">{data.healthAndSafety.safetyNotes.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                </>}
            </Section>
             <Section title="الثقافة المحلية" id="culture" Icon={EtiquetteIcon}>
                 <h4 className="font-semibold">آداب وسلوكيات</h4>
                 <ul className="list-disc list-inside mt-1 mb-3">{data.localCulture.etiquette.map((e, i) => <li key={i}>{e}</li>)}</ul>
                 <h4 className="font-semibold">عبارات مفيدة</h4>
                 <div className="space-y-1 mt-2">
                     {data.localCulture.helpfulPhrases.map((p, i) => (
                         <p key={i}><strong>{p.phrase}:</strong> {p.translation} <i>({p.pronunciation})</i></p>
                     ))}
                 </div>
            </Section>
             <Section title="للمسافر المسلم" id="muslim" Icon={MosqueIcon}>
                <h4 className="font-semibold">الطعام الحلال</h4>
                <p className="mb-3">{data.muslimTravelerInfo.halalFoodAvailability}</p>
                <h4 className="font-semibold">المساجد وأوقات الصلاة</h4>
                <p className="mb-3">{data.muslimTravelerInfo.nearbyMosquesSuggestion}</p>
                 {data.muslimTravelerInfo.prayerTimesLink && <a href={data.muslimTravelerInfo.prayerTimesLink} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">رابط لأوقات الصلاة</a>}
            </Section>
            <Section title="معلومات عملية" id="practical" Icon={GuideIcon}>
                <h4 className="font-semibold">مقابس الكهرباء</h4>
                <p className="mb-3">{data.practicalInfo.powerPlugs}</p>
                <h4 className="font-semibold">مياه الشرب</h4>
                <p>{data.practicalInfo.drinkingWater}</p>
            </Section>
        </div>
    );

    return (
        <div className="flex flex-col items-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">دليل المسافر الشامل</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">احصل على دليل سفر متكامل لأي وجهة في العالم.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="أدخل اسم مدينة أو دولة (مثال: جنيف، سويسرا)"
                        className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !location.trim()}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : <GuideIcon className="w-5 h-5" />}
                        <span className="ml-2">{isLoading ? 'جاري الإنشاء...' : 'أنشئ الدليل'}</span>
                    </button>
                </div>
                
                <div className="w-full">
                    {isLoading && (
                        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                            <p>...نحزم حقائب المعرفة لك، لحظات من فضلك</p>
                        </div>
                    )}
                    {error && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
                    {guide && renderGuide(guide)}
                    {!isLoading && !guide && !error && (
                         <div className="text-center text-gray-400 dark:text-gray-500 pt-12">
                            <GuideIcon className="w-20 h-20 mx-auto mb-4" />
                            <p>أدخل وجهتك أعلاه لإنشاء دليلك المخصص.</p>
                         </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                .prose { white-space: pre-wrap; }
                .prose li { list-style-type: none; padding-left: 0; }
            `}</style>
        </div>
    );
};

export default TravelerGuide;