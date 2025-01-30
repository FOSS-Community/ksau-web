import { config } from "../config";

interface TokenResponse {
  access_token: string;
  client_id: string;
  client_secret: string;
  drive_id: string;
  drive_type: string;
  base_url: string;
  upload_root_path: string;
}

interface UploadSessionResponse {
  uploadUrl: string;
}

export async function getUploadToken(remote: string): Promise<TokenResponse> {
  const response = await fetch(`${config.apiEndpoint}${config.endpoints.token}?remote=${remote}`);
  if (!response.ok) {
    throw new Error('Failed to get upload token');
  }
  return response.json();
}

export async function createUploadSession(
  accessToken: string,
  remoteFilePath: string
): Promise<string> {
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${remoteFilePath}:/createUploadSession`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create upload session');
  }

  const data: UploadSessionResponse = await response.json();
  return data.uploadUrl;
}

export async function uploadFileInChunks(
  file: File,
  uploadUrl: string,
  chunkSizeInMB: number,
  onProgress: (progress: number) => void
): Promise<void> {
  const chunkSize = chunkSizeInMB * 1024 * 1024;
  const fileSize = file.size;
  let start = 0;

  while (start < fileSize) {
    const end = Math.min(start + chunkSize, fileSize);
    const chunk = file.slice(start, end);
    const contentRange = `bytes ${start}-${end - 1}/${fileSize}`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': contentRange,
      },
      body: chunk,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${contentRange}`);
    }

    start = end;
    const progress = (start / fileSize) * 100;
    onProgress(Math.round(progress));
  }
}