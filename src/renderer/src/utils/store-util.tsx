//类似shared-preferences，简单的数据存储到配置文件
import Store from 'electron-store';
import { app } from 'electron';

class StoreManager {
  private static instance: StoreManager;
  private store: Store;

  private constructor() {
    const option = {
      name: 'setting',
      fileExtension: 'json',
      cwd: app.getPath('userData'),
      encryptionKey: "aes-256-cbc",
      clearInvalidConfig: true,
    };

    this.store = new Store();
  }

  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }

    return StoreManager.instance;
  }

  public getStore(): Store {
    return this.store;
  }
}

// 导出单例的 Store 实例
export default StoreManager.getInstance().getStore();