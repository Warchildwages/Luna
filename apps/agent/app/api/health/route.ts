export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'luna-agent',
    timestamp: new Date().toISOString(),
    mockMode: process.env.ALLFANS_MOCK_MODE === 'true',
  });
}