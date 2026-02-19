import { useState, useRef } from 'react';

interface NewProjectDialogProps {
  onClose: () => void;
  onCreateProject: (name: string, type: 'builder' | 'upload', modelUrl?: string) => void;
}

type ProjectType = 'builder' | 'upload';

export const NewProjectDialog = ({ onClose, onCreateProject }: NewProjectDialogProps) => {
  const [step, setStep] = useState<'choose-type' | 'configure'>('choose-type');
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [projectName, setProjectName] = useState('');
  const [uploadedModelUrl, setUploadedModelUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeSelect = (type: ProjectType) => {
    setSelectedType(type);
    setStep('configure');
    setProjectName(type === 'builder' ? 'My 3D Model' : 'Mój model');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 50MB limit. Please choose a smaller file.');
      e.target.value = '';
      return;
    }

    if (!file.name.match(/\.(gltf|glb)$/i)) {
      alert('Invalid file type. Please select a GLTF (.gltf) or GLB (.glb) file.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setUploadedModelUrl(dataUrl);
        setUploadedFileName(file.name);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!selectedType || !projectName.trim()) return;
    if (selectedType === 'upload' && !uploadedModelUrl) return;
    onCreateProject(projectName.trim(), selectedType, uploadedModelUrl ?? undefined);
  };

  const canCreate = selectedType && projectName.trim() && (selectedType === 'builder' || uploadedModelUrl);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Dodaj nowy model</h2>
                <p className="text-xs text-slate-400">Wybierz sposób tworzenia dokumentacji</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${step === 'choose-type' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
              Typ projektu
            </div>
            <div className="flex-1 h-px bg-slate-600"></div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${step === 'configure' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
              Konfiguracja
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'choose-type' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">Jak chcesz stworzyć dokumentację 3D?</p>
              
              {/* Builder option */}
              <button
                onClick={() => handleTypeSelect('builder')}
                className="w-full p-5 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-base mb-1">🧱 Zbuduj model 3D</h3>
                    <p className="text-sm text-slate-500">Twórz instrukcje krok po kroku używając kształtów 3D (sześciany, sfery, cylindry). Idealne do diagramów przepływu i instrukcji montażu.</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Flow diagrams</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Step-by-step</span>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Upload option */}
              <button
                onClick={() => handleTypeSelect('upload')}
                className="w-full p-5 border-2 border-slate-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-base mb-1">📤 Wgraj własny model</h3>
                    <p className="text-sm text-slate-500">Wgraj swój własny model GLTF/GLB i twórz dokumentację klikając na elementy modelu. Idealne do rzeczywistych produktów.</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">GLTF/GLB</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Real models</span>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-slate-300 group-hover:text-green-500 transition-colors flex-shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {step === 'configure' && selectedType && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('choose-type')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Wróć do wyboru typu
              </button>

              <div className={`flex items-center gap-3 p-3 rounded-xl ${selectedType === 'builder' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedType === 'builder' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                  {selectedType === 'builder' ? '🧱' : '📤'}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${selectedType === 'builder' ? 'text-blue-700' : 'text-green-700'}`}>
                    {selectedType === 'builder' ? 'Zbuduj model 3D' : 'Wgraj własny model'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedType === 'builder' ? 'Tworzenie z kształtów 3D' : 'Import modelu GLTF/GLB'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nazwa projektu</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Podaj nazwę projektu…"
                  autoFocus
                />
              </div>

              {selectedType === 'upload' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Plik modelu 3D</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploadedModelUrl ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".gltf,.glb"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-slate-500">Wczytywanie pliku…</p>
                      </div>
                    ) : uploadedModelUrl ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-700">{uploadedFileName}</p>
                          <p className="text-xs text-slate-500">Kliknij aby zmienić plik</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-slate-600">Kliknij aby wybrać plik</p>
                        <p className="text-xs text-slate-400 mt-0.5">GLTF lub GLB, max 50MB</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Anuluj
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!canCreate}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${canCreate ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  Utwórz projekt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
