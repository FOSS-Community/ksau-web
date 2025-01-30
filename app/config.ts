// Configuration with fallback values
export const config = {
  apiEndpoint: (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_ENDPOINT : undefined) || 'https://project.ksauraj.eu.org',
  endpoints: {
    upload: '/upload',
    token: '/token'
  }
};