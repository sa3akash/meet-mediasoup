export async function uploadMeetingFile(
  meetingId: string,
  selectedFile: File,
  onUploadFallback: (fileName: string, mimeType: string, base64Data: string) => Promise<any>
): Promise<any> {
  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("displayName", "Me");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${apiBase}/api/files/${meetingId}/upload`, {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    const data = await res.json();
    return data.file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const uploadRes = await onUploadFallback(
          selectedFile.name,
          selectedFile.type || "application/octet-stream",
          base64
        );
        resolve(uploadRes?.file || null);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(selectedFile);
  });
}
