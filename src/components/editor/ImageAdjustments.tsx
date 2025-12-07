import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

const ImageAdjustments = () => {
    const {
        originalImage, isManualCropping,
        imgBrightness, setImgBrightness,
        imgContrast, setImgContrast,
        imgSaturation, setImgSaturation,
        t
    } = useEditor();

    if (!originalImage || isManualCropping) return null;

    const resetImageAdjustments = () => {
        setImgBrightness(100);
        setImgContrast(100);
        setImgSaturation(100);
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                    <Sliders size={16} /> {t('imageAdjustments')}
                </h2>
                <button
                    onClick={resetImageAdjustments}
                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                    <RotateCcw size={10} /> {t('reset')}
                </button>
            </div>

            <div className="space-y-3 p-3 bg-[#0f0f0f] border border-gray-700 rounded">
                <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>{t('brightness')}</span>
                        <span>{imgBrightness}%</span>
                    </div>
                    <input
                        type="range" min="0" max="200"
                        value={imgBrightness}
                        onChange={(e) => setImgBrightness(Number(e.target.value))}
                        className="w-full accent-purple-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>{t('contrast')}</span>
                        <span>{imgContrast}%</span>
                    </div>
                    <input
                        type="range" min="0" max="200"
                        value={imgContrast}
                        onChange={(e) => setImgContrast(Number(e.target.value))}
                        className="w-full accent-purple-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>{t('saturation')}</span>
                        <span>{imgSaturation}%</span>
                    </div>
                    <input
                        type="range" min="0" max="200"
                        value={imgSaturation}
                        onChange={(e) => setImgSaturation(Number(e.target.value))}
                        className="w-full accent-purple-600 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </section>
    );
};

export default ImageAdjustments;
