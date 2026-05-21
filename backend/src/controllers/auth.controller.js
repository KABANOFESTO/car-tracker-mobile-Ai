const { AppError } = require('../utils/errors');
const { loginUser } = require('../services/auth.service');

async function loginController(request, response) {
  const { email, password } = request.body || {};

  if (!email || !password) {
    throw new AppError(400, 'email and password are required');
  }

  const result = await loginUser(email, password);
  response.json({ ok: true, ...result });
}

async function meController(request, response) {
  response.json({
    ok: true,
    user: {
      id: request.user._id.toString(),
      name: request.user.name,
      email: request.user.email,
      role: request.user.role,
    },
  });
}

module.exports = { loginController, meController };
