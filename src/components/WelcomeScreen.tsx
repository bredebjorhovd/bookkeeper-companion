
import FileUploader from "@/components/FileUploader";

interface WelcomeScreenProps {
  onFileSelect: (file: File) => void;
}

const WelcomeScreen = ({ onFileSelect }: WelcomeScreenProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Upload an Invoice</h2>
      <FileUploader onFileSelect={onFileSelect} />
    </div>
  );
};

export default WelcomeScreen;
