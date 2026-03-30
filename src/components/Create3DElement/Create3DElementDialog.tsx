import { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Custom3DElement } from '../../types';
import { saveCustom3DElement } from '../../utils/custom3DElements';
import { Custom3DShape } from '../Viewer3D/Custom3DShape';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  existing?: Custom3DElement;
  onClose: () => void;
  onSaved: (element: Custom3DElement) => void;
}

export const Create3DElementDialog = ({ existing, onClose, onSaved }: Props) => {
  const { t } = useLanguage();
  const [text, setText] = useState(existing?.text ?? '');
  const [color, setColor] = useState(existing?.color ?? '#4299e1');
  const [textureDataUrl, setTextureDataUrl] = useState<string | undefined>(existing?.textureDataUrl);
  const [textureFileName, setTextureFileName] = useState<string>('');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewElement: Custom3DElement = {
    id: existing?.id ?? 'preview',
    name: text || 'TXT',
    text: text || 'TXT',
    color,
    wireframe: false,
    wireframeColor: '#000000',
    textureDataUrl,
    createdAt: existing?.createdAt ?? Date.now(),
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value.slice(0, 12));
  };

  const handleTextureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(t('create3DElementDialog.alertInvalidTextureType'));
      e.target.value = '';
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t('create3DElementDialog.alertFileTooLarge'));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setTextureDataUrl(result);
        setTextureFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemoveTexture = () => {
    setTextureDataUrl(undefined);
    setTextureFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      alert(t('create3DElementDialog.alertEnterText'));
      return;
    }
    setIsSaving(true);
    try {
      const payload: Custom3DElement = {
        id: existing?.id ?? '',
        name: trimmed,
        text: trimmed,
        color,
        wireframe: false,
        wireframeColor: '#000000',
        textureDataUrl,
        description: description.trim() || undefined,
        createdAt: existing?.createdAt ?? Date.now(),
      };

      const saved = await saveCustom3DElement(payload, !existing);
      onSaved(saved);
    } catch (err) {
      alert((err as Error).message ?? t('create3DElementDialog.alertSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <h2 className="text-xl font-bold text-white">
            {existing ? t('create3DElementDialog.titleEdit') : t('create3DElementDialog.titleCreate')}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
            aria-label={t('create3DElementDialog.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Form */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('create3DElementDialog.textLabel')} <span className="text-gray-400 font-normal">{t('create3DElementDialog.textHint')}</span>
              </label>
              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                maxLength={12}
                placeholder={t('create3DElementDialog.textPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">{text.length}/12</p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('create3DElementDialog.colorLabel')}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            {/* Texture */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('create3DElementDialog.textureLabel')} <span className="text-gray-400 font-normal">{t('create3DElementDialog.textureHint')}</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleTextureUpload}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded file:text-xs file:bg-gray-50 hover:file:bg-gray-100"
              />
              {textureDataUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={textureDataUrl} alt={t('create3DElementDialog.texturePreviewAlt')} className="w-10 h-10 object-cover rounded border border-gray-200" />
                  <span className="text-xs text-gray-600 truncate max-w-[140px]">{textureFileName || t('create3DElementDialog.textureLabel')}</span>
                  <button
                    onClick={handleRemoveTexture}
                    className="text-xs text-red-500 hover:text-red-700 transition"
                  >
                    {t('create3DElementDialog.textureRemove')}
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">{t('create3DElementDialog.textureInfo')}</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('create3DElementDialog.descriptionLabel')} <span className="text-gray-400 font-normal">{t('create3DElementDialog.descriptionHint')}</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t('create3DElementDialog.descriptionPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
            </div>
          </div>

          {/* 3D Preview */}
          <div className="w-full md:w-56 h-56 md:h-auto bg-slate-900 flex-shrink-0">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <Custom3DShape element={previewElement} />
              <OrbitControls enablePan={false} />
            </Canvas>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t('create3DElementDialog.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? t('create3DElementDialog.saving') : t('create3DElementDialog.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
