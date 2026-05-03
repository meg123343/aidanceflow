export default {
  fetch() {
    return Response.json({
      ok: true,
      runtime: 'vercel',
      message: 'AIDanceFlow API is running',
    });
  },
};
