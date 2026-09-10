import './index';

declare module './index' {
  interface UserProfile {
    accountReference?: string;
    isMarketer?: boolean;
    marketerStatus?: 'active' | 'paused' | 'inactive';
    marketerCode?: string;
    marketerActivatedAt?: string;
    marketerUpdatedAt?: string;
  }
}
