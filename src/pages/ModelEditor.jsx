import { MainLayout } from '../components/Layout/MainLayout';
import { useNavigate } from 'react-router-dom';

const ModelEditor = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-screen h-screen">
      <MainLayout 
        onBackToProjectList={handleBackToDashboard}
        useSampleProjectFallback={true}
      />
    </div>
  );
};

export default ModelEditor;
