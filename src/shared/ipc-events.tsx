export enum IpcEvents {
  EV_PING = 'ping',
  // 获取窗口设备窗口
    EV_SEND_DESKTOP_CAPTURER_SOURCE = "ev:send-desktop-capturer_source",
    EV_SEND_DESKTOP_CAPTURER_IMAGE = "ev:send-desktop-capturer_image",
    //修改窗口大小
    EV_CHANGE_WINDOWS_SIZE = "ev:change-window-size",
    //手动拖动修改窗口大小
    EV_WINDOW_RESIZE = "ev:window-resize",
    //设备信息
    EV_DEVICE_INFO = "ev:device-info",
    //打开用户资料窗
    EV_OPEN_USER_AVATAR_WIN = "ev:open-user-avatar-window",
    //打开独立对话窗
    EV_OPEN_SEPARATE_DIALOGUE_WIN = "ev:open-separate_dialogue_window",
    //打开群成员列表窗
    EV_OPEN_MUC_MEMBERS_WIN = "ev:open-muc-members-window",
    //打开全局搜索窗口
    EV_OPEN_SEARCH_GLOBAL_WIN = "ev:open-search-global-window",
    //打开搜索好友
    EV_OPEN_SEARCH_USER_WIN = "ev:open-search-user-window",
    //打开设置窗口
    EV_OPEN_SYS_SETTING_WIN = "ev:open-sys-setting-window",
    //打开关于窗口
    EV_OPEN_ABOUT_WIN = "ev:open-about-window",
    //打开发现页窗口
    EV_OPEN_DISCOVER_WIN = "ev:open-discover-window",
    //新的xmpp消息
    EV_NEW_XMPP_MSG = 'ev:new-xmpp-msg',
  
    //获取当前登录用户
    EV_GET_CURRENT_USER = 'ev:get-current-user',
    //设置当前登录用户
    EV_SET_CURRENT_USER = 'ev:set-current-user',
    
  }
  
  export type IpcChannels = keyof IpcEvents;