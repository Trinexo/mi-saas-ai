export const ok = (res, data, message = 'ok') => {
  return res.status(200).json({ success: true, message, data });
};

export const created = (res, data, message = 'created') => {
  return res.status(201).json({ success: true, message, data });
};