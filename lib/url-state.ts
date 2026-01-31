/**
 * URL State Management
 * 
 * 仕様準拠: セミコロン区切り形式
 * Format: ?s=サービス名(技術:バージョン,技術:バージョン);サービス名(技術:バージョン)
 * Example: ?s=myapp(python:3.9,nodejs:18.0);api(go:1.20)
 */

import { Service, Technology, URLState } from './types';

export const MAX_URL_LENGTH = 2048;
const SCHEMA_VERSION = 1;

// 特殊文字: :, ;, ,, (, ), スペース
const SPECIAL_CHARS = /[:;,() ]/;

/**
 * 文字列が特殊文字を含む場合のみエンコード
 */
function encodeIfNeeded(str: string): string {
  if (SPECIAL_CHARS.test(str)) {
    return encodeURIComponent(str);
  }
  return str;
}

/**
 * 文字列をデコード（%が含まれる場合のみ）
 */
function decodeIfNeeded(str: string): string {
  if (str.includes('%')) {
    return decodeURIComponent(str);
  }
  return str;
}

/**
 * URLStateをセミコロン区切り形式にエンコード
 */
export function encodeURLState(state: URLState): string {
  if (!state.services || state.services.length === 0) {
    return '';
  }

  const encodedServices = state.services.map(service => {
    const serviceName = encodeIfNeeded(service.name);
    const technologies = service.technologies
      .map(tech => `${encodeIfNeeded(tech.name)}:${encodeIfNeeded(tech.currentVersion)}`)
      .join(',');
    return `${serviceName}(${technologies})`;
  });

  const encoded = encodedServices.join(';');
  
  // URL長チェック
  const fullUrl = `?s=${encoded}`;
  if (fullUrl.length > MAX_URL_LENGTH) {
    throw new Error(`URL length (${fullUrl.length}) exceeds maximum allowed length (${MAX_URL_LENGTH})`);
  }

  return encoded;
}

/**
 * セミコロン区切り形式の文字列をURLStateにデコード
 * 不完全なデータは無視して、可能な限り表示する
 */
export function decodeURLState(encoded: string): URLState {
  if (!encoded || encoded.trim() === '') {
    return { version: SCHEMA_VERSION, services: [] };
  }

  const trimmed = encoded.trim();
  const services: Service[] = [];
  let serviceIndex = 0;

  // サービスごとに分割（セミコロン区切り）
  const serviceSegments = trimmed.split(';');

  for (const segment of serviceSegments) {
    if (!segment) continue;

    // サービス名と技術リストを分離
    const match = segment.match(/^(.+)\((.*)\)$/);
    if (!match) {
      console.warn(`[decodeURLState] Skipping invalid segment: "${segment}"`);
      continue;
    }

    const [, serviceNameEncoded, technologiesStr] = match;
    const serviceName = decodeIfNeeded(serviceNameEncoded);

    if (!serviceName) {
      console.warn(`[decodeURLState] Skipping service with empty name`);
      continue;
    }

    // 技術リストを解析（不完全なものはスキップ）
    const technologies: Technology[] = [];
    if (technologiesStr) {
      const techSegments = technologiesStr.split(',');
      
      for (let i = 0; i < techSegments.length; i++) {
        const techSegment = techSegments[i];
        if (!techSegment) continue;

        const colonIndex = techSegment.indexOf(':');
        if (colonIndex === -1) {
          console.warn(`[decodeURLState] Skipping technology without colon: "${techSegment}"`);
          continue;
        }

        const techName = decodeIfNeeded(techSegment.substring(0, colonIndex));
        const version = decodeIfNeeded(techSegment.substring(colonIndex + 1));

        // 不完全な技術はスキップ
        if (!techName || !version) {
          console.warn(`[decodeURLState] Skipping incomplete technology: name="${techName}", version="${version}"`);
          continue;
        }

        technologies.push({
          id: `tech-${serviceIndex}-${i}`,
          name: techName,
          currentVersion: version,
        });
      }
    }

    // 技術が0個のサービスも表示する（空のサービスとして）
    services.push({
      id: `service-${serviceIndex}`,
      name: serviceName,
      technologies,
    });

    serviceIndex++;
  }

  return {
    version: SCHEMA_VERSION,
    services,
  };
}

/**
 * 現在のURLからURLStateを取得
 */
export function getURLStateFromCurrentURL(): {
  success: boolean;
  data?: URLState;
  error?: { type: string; message: string };
} {
  try {
    console.log('[getURLStateFromCurrentURL] window check:', typeof window === 'undefined');
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { version: SCHEMA_VERSION, services: [] },
      };
    }

    console.log('[getURLStateFromCurrentURL] window.location.search:', window.location.search);
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('s');
    console.log('[getURLStateFromCurrentURL] dataParam:', dataParam);

    if (!dataParam) {
      return {
        success: true,
        data: { version: SCHEMA_VERSION, services: [] },
      };
    }

    const decoded = decodeURLState(dataParam);
    console.log('[getURLStateFromCurrentURL] decoded:', decoded);
    return { success: true, data: decoded };
  } catch (error) {
    console.error('[getURLStateFromCurrentURL] Error:', error);
    return {
      success: false,
      error: {
        type: 'DECODE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * URLStateを現在のURLに設定
 */
export function setURLState(state: URLState): {
  success: boolean;
  error?: { type: string; message: string };
} {
  try {
    if (typeof window === 'undefined') {
      return { success: true };
    }

    const encoded = encodeURLState(state);
    const url = new URL(window.location.href);
    
    if (!encoded) {
      url.searchParams.delete('s');
    } else {
      url.searchParams.set('s', encoded);
    }
    
    window.history.replaceState({}, '', url.toString());
    return { success: true };
  } catch (error) {
    console.error('Failed to set URL state:', error);
    
    if (error instanceof Error && error.message.includes('exceeds maximum')) {
      return {
        success: false,
        error: {
          type: 'URL_TOO_LONG',
          message: error.message,
        },
      };
    }
    
    return {
      success: false,
      error: {
        type: 'ENCODE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * URLからdataパラメータをクリア
 */
export function clearURLState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('s');
  window.history.replaceState({}, '', url.toString());
}


