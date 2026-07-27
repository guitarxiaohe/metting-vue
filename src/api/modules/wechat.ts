import { httpClient } from '../client';

export interface WxQrCodeResponse {
  /** 扫码登录唯一标识 */
  uuid: string;
  /** 过期时间（秒） */
  expireSeconds?: number;
  /** 二维码内容 URL（优先使用此字段；为空时前端自动拼接） */
  qrUrl?: string;
}

export interface WxScanStatusResponse {
  /** PENDING | SCANNING | CONFIRMED | EXPIRED */
  status: 'PENDING' | 'SCANNING' | 'CONFIRMED' | 'EXPIRED';
  /** 确认登录后返回的 JWT token */
  token?: string;
  /** 关联的会议 ID */
  meetingId?: string;
}

/**
 * 获取微信扫码登录的 UUID，用于生成二维码
 * GET /wx/get-qr
 */
export const getWxQrCode = () => {
  return httpClient.get<WxQrCodeResponse>('/wx/auth/get-qr');
};

/**
 * 轮询扫码登录状态
 * GET /wx/get-qr/status?uuid=xxx
 */
export const getWxScanStatus = (uuid: string) => {
  return httpClient.get<WxScanStatusResponse>('/wx/auth/get-qr/status', {
    uuid,
  });
};
