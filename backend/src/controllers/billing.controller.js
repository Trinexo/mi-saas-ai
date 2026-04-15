import { ok } from '../utils/response.js';
import { billingService } from '../services/billing.service.js';

export const postCheckoutSession = async (req, res, next) => {
  try {
    const { oposicionId } = req.body;
    const result = await billingService.crearCheckoutSession({
      userId: req.user.userId,
      oposicionId: Number(oposicionId),
      userEmail: req.user.email,
    });
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
};

export const postWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    // req.rawBody debe estar configurado en el middleware de Express
    await billingService.procesarWebhook(req.rawBody, signature);
    return res.status(200).json({ received: true });
  } catch (error) {
    return next(error);
  }
};

export const patchPrecioOposicion = async (req, res, next) => {
  try {
    const oposicionId = Number(req.params.oposicionId);
    const { precioEuros } = req.body;
    const result = await billingService.setPrecio(oposicionId, precioEuros);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Oposición no encontrada' });
    }
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
};
