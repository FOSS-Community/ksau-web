"use client";

import { useState, useCallback, useEffect } from "react";
import { config } from "./config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Share2, Copy, ExternalLink, Github, Twitter, Terminal, FileUp } from "lucide-react";
import { AnimatedText } from "./components/animated-text";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { SystemInfo } from "./components/system-info";
import { StorageQuota } from "./components/storage-quota";
import { Switch } from "@/components/ui/switch";
import { getUploadToken, createUploadSession, uploadFileInChunks } from "./utils/upload";

export default function Home() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cliCommand, setCliCommand] = useState("");
  const [isClientSideUpload, setIsClientSideUpload] = useState(true);
  const [formValues, setFormValues] = useState({
    remote: "oned",
    remoteFolder: "/",
    remoteFileName: "",
    chunkSize: "4"
  });
  const { toast } = useToast();

  const updateCliCommand = useCallback(() => {
    if (!selectedFile) return;
    
    let command = `ksau-go upload -f "${selectedFile.name}"`;
    command += ` -r "${formValues.remoteFolder || '/'}"`;
    if (formValues.remoteFileName) {
      command += ` -n "${formValues.remoteFileName}"`;
    }
    command += ` -s ${parseInt(formValues.chunkSize) * 1024 * 1024}`;
    command += ` --remote-config ${formValues.remote}`;
    
    setCliCommand(command.trim());
  }, [selectedFile, formValues]);

  useEffect(() => {
    updateCliCommand();
  }, [selectedFile, formValues, updateCliCommand]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      toast({
        title: "File selected",
        description: `${acceptedFiles[0].name} (${(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB)`,
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleFormChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSideUpload = async () => {
    if (!selectedFile) return;

    try {
      // Get upload token
      const tokenResponse = await getUploadToken(formValues.remote);
      
      // Construct remote file path
      const fileName = formValues.remoteFileName || selectedFile.name;
      const remoteFilePath = `${tokenResponse.upload_root_path}/${formValues.remoteFolder.replace(/^\/+|\/+$/g, '')}/${fileName}`.replace(/\/+/g, '/');
      
      // Create upload session
      const uploadUrl = await createUploadSession(tokenResponse.access_token, remoteFilePath);
      
      // Upload file in chunks
      await uploadFileInChunks(
        selectedFile,
        uploadUrl,
        parseInt(formValues.chunkSize),
        setUploadProgress
      );

      // Set download URL
      const downloadPath = `${tokenResponse.base_url}/${formValues.remoteFolder.replace(/^\/+|\/+$/g, '')}/${fileName}`;
      setDownloadUrl(downloadPath);

      toast({
        title: "Upload complete",
        description: "File uploaded successfully to the cloud",
      });
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = "Upload failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTraditionalUpload = async (formData: FormData) => {
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 500);

      const response = await fetch(`${config.apiEndpoint}${config.endpoints.upload}`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();
      if (response.ok) {
        setUploadProgress(100);
        setDownloadUrl(result.downloadURL);
        toast({
          title: "Upload complete",
          description: "File uploaded successfully to the cloud",
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (isClientSideUpload) {
        await handleClientSideUpload();
      } else {
        const formData = new FormData(event.currentTarget);
        formData.set('file', selectedFile);
        await handleTraditionalUpload(formData);
      }
    } catch (error) {
      setUploadProgress(0);
      console.error('Upload error:', error);
      
      let errorMessage = "Upload failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection";
      } else {
        try {
          const errorResponse = await (error as Response).json();
          errorMessage = errorResponse.message || errorMessage;
        } catch {
          // Keep default error message if json parsing fails
        }
      }

      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(downloadUrl).then(() => {
      toast({
        title: "URL Copied",
        description: "Download link copied to clipboard",
      });
    });
  };

  const openUrl = () => {
    window.open(downloadUrl, "_blank");
  };

  const copyCliCommand = () => {
    navigator.clipboard.writeText(cliCommand).then(() => {
      toast({
        title: "Command Copied",
        description: "CLI command copied to clipboard",
      });
    });
  };

  return (
    <main className="min-h-screen bg-black text-green-500 py-8 px-4 relative overflow-hidden">
      <div className="matrix-background">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="matrix-rain"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            {"{>}"} $
          </div>
        ))}
      </div>

      <div className="container mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center space-x-3">
            <Terminal className="h-10 w-10" />
            <h1 className="text-5xl font-bold terminal-cursor">Ksau Web</h1>
          </div>
          <div className="space-y-2">
            <p className="text-xl terminal-text">{"{>}"} Your files, our space, until we run out</p>
            <p className="text-sm text-green-700">{"{>}"} Free storage powered by OneDrive</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <Card className="border-green-900 bg-black/50 backdrop-blur h-full">
              <CardHeader>
                <CardTitle className="text-lg">{"{>}"} Why We Do This</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-green-300">
                    {"{>}"} Supporting the open-source community by providing hassle-free file sharing for developers.
                  </p>
                  <p className="text-sm text-green-300">
                    {"{>}"} No signups, no complications - just upload and share.
                  </p>
                  <p className="text-sm text-green-300">
                    {"{>}"} Built by developers, for developers.
                  </p>
                </div>
                <SystemInfo />
                <div className="pt-4 border-t border-green-900">
                  <div className="space-y-2">
                    <p className="text-sm text-green-400">{"{>}"} CLI Command:</p>
                    <div className="flex justify-between items-start gap-2">
                      <code className="text-xs text-green-300 font-mono block overflow-x-auto whitespace-pre">
                        {cliCommand}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={copyCliCommand}
                        className="hover:bg-green-950 h-6 w-6 flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-4">
                    {"{>}"} This project is open-source! Join us in making file sharing easier for developers.
                  </p>
                  <a
                    href="https://github.com/global-index-source/ksau-go"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:underline text-xs inline-flex items-center gap-1 mt-2"
                  >
                    <Terminal className="h-3 w-3" />
                    Try our CLI tool
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-6">
            <Card className="border-green-900 bg-black/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileUp className="h-6 w-6" />
                  Upload Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center justify-between space-x-4 mb-4">
                    <label className="text-sm text-green-300">Client-side Upload</label>
                    <Switch
                      checked={isClientSideUpload}
                      onCheckedChange={setIsClientSideUpload}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div 
                    {...getRootProps()} 
                    className={`drop-zone p-10 rounded-lg cursor-pointer ${
                      isDragActive ? 'active' : ''
                    } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <input {...getInputProps()} disabled={isUploading} />
                    <div className="text-center space-y-2">
                      <Upload className="h-10 w-10 mx-auto" />
                      <p className="text-lg">
                        {isDragActive
                          ? "{>} Deploying files..."
                          : selectedFile 
                            ? `{>} Selected: ${selectedFile.name}`
                            : "{>} Drag 'n' drop or click to select"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">
                      {"{>}"} SELECT_REMOTE
                    </label>
                    <Select 
                      name="remote" 
                      defaultValue={formValues.remote}
                      onValueChange={(value) => handleFormChange('remote', value)}
                      disabled={isUploading}
                    >
                      <SelectTrigger className="border-green-900 bg-black text-green-500">
                        <SelectValue placeholder="Select remote" />
                      </SelectTrigger>
                      <SelectContent className="border-green-900 bg-black text-green-500">
                        <SelectItem value="hakimionedrive">{"{>}"} Hakimi OneDrive</SelectItem>
                        <SelectItem value="oned">{"{>}"} OneDrive</SelectItem>
                        <SelectItem value="saurajcf">{"{>}"} Sauraj CF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">
                      {"{>}"} REMOTE_FOLDER
                    </label>
                    <Input
                      type="text"
                      name="remoteFolder"
                      value={formValues.remoteFolder}
                      onChange={(e) => handleFormChange('remoteFolder', e.target.value)}
                      placeholder="{>} Enter target directory"
                      className="border-green-900 bg-black text-green-500 placeholder:text-green-800"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">
                      {"{>}"} CUSTOM_FILENAME
                    </label>
                    <Input
                      type="text"
                      name="remoteFileName"
                      value={formValues.remoteFileName}
                      onChange={(e) => handleFormChange('remoteFileName', e.target.value)}
                      placeholder="{>} Enter custom filename"
                      className="border-green-900 bg-black text-green-500 placeholder:text-green-800"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">
                      {"{>}"} CHUNK_SIZE
                    </label>
                    <Select
                      name="chunkSize"
                      defaultValue={formValues.chunkSize}
                      onValueChange={(value) => handleFormChange('chunkSize', value)}
                      disabled={isUploading}
                    >
                      <SelectTrigger className="border-green-900 bg-black text-green-500">
                        <SelectValue placeholder="Select chunk size" />
                      </SelectTrigger>
                      <SelectContent className="border-green-900 bg-black text-green-500">
                        <SelectItem value="2">{"{>}"} 2MB</SelectItem>
                        <SelectItem value="4">{"{>}"} 4MB</SelectItem>
                        <SelectItem value="8">{"{>}"} 8MB</SelectItem>
                        <SelectItem value="16">{"{>}"} 16MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{"{>}"} Upload progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress
                        value={uploadProgress}
                        className="h-2 bg-green-950"
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <Button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className={`w-full border-green-500 ${
                        isUploading || !selectedFile
                          ? 'bg-green-500/5 text-green-700 cursor-not-allowed'
                          : 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
                      }`}
                    >
                      {isUploading ? (
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4 animate-pulse" /> {"{>}"} Processing upload...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4" /> {"{>}"} Execute upload
                        </span>
                      )}
                    </Button>

                    <div className="text-center space-y-2">
                      <p className="text-sm text-green-700">{"{>}"} Want more power? Try our CLI:</p>
                      <a
                        href="https://github.com/global-index-source/ksau-go"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:underline text-sm inline-flex items-center gap-1"
                      >
                        <Terminal className="h-4 w-4" />
                        ksau-go on GitHub
                      </a>
                    </div>
                  </div>
                </form>

                {downloadUrl && (
                  <div className="mt-6 space-y-2">
                    <div className="download-box">
                      <div className="download-box-content flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-green-700 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <AnimatedText
                            text={downloadUrl}
                            className="text-sm text-green-300 pb-1"
                            config={{
                              charDelay: 40,
                              animDuration: 300
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={copyUrl}
                          className="hover:bg-green-950 flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={openUrl}
                          className="hover:bg-green-950 flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Card className="border-green-900 bg-black/50 backdrop-blur h-full">
              <CardHeader>
                <CardTitle className="text-lg">{"{>}"} Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-green-400 font-medium">{"{>}"} Acceptable Files:</p>
                  <ul className="text-sm text-green-300 space-y-1 list-disc pl-4">
                    <li>Development builds and test files</li>
                    <li>Project assets for testing</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-green-400 font-medium">{"{>}"} Storage Policy:</p>
                  <ul className="text-sm text-green-300 space-y-1 list-disc pl-4">
                    <li>Files removed at 90% storage capacity</li>
                    <li>Contact maintainers for file deletion</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-green-900">
                  <StorageQuota />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="text-center text-sm space-y-4 text-green-700">
          <div className="flex justify-center gap-6">
            <a
              href="https://github.com/global-index-source/ksau-go"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-500 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/k_sauraj"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-500 transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
          <div className="space-y-1">
            <p className="terminal-cursor">{"{>}"} Project Maintainers:</p>
            <div className="flex justify-center gap-4">
              <span className="text-green-500">ksauraj</span>
              <span className="text-green-500">hakimi</span>
              <span className="text-green-500">pratham</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
