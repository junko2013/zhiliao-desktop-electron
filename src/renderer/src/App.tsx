import Demo from './views/Demo'
import { useState, useEffect } from 'react'
import { IpcEvents } from '@shared/ipc-events'
import storeUtil from './utils/store-util'

export default function App(): JSX.Element {
  const [deviceInfo, setDeviceInfo] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    //获取设备信息
    const fetchDeviceInfo = async () => {
      const device = await window.electron.ipcRenderer.invoke(IpcEvents.EV_DEVICE_INFO)
      setDeviceInfo(device)
      setLoading(false)
      // storeUtil.set('device', device)
    }

    fetchDeviceInfo();
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  // console.log('device', storeUtil.get('device'))

  return (
    <>
      {/* 顶部交通灯区域可拖动窗体 */}
      <div className="h-[32px] draggable"></div>
      <Demo />
    </>
  )
}
