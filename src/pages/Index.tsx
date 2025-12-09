import { EditorLayout } from '@/components/editor/EditorLayout';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>PixelForge AI - Intelligent Photo & Video Editor</title>
        <meta name="description" content="Transform your images with AI-powered editing tools. Apply filters, adjust colors, and let AI assist your creative workflow." />
      </Helmet>
      <EditorLayout />
    </>
  );
};

export default Index;
