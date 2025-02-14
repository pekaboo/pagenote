import { type ReactNode, useEffect } from 'react'
import useVersionValid from 'hooks/useVersionValid'
import extApi from '@pagenote/shared/lib/pagenote-api'
import useCurrentTab from 'hooks/useCurrentTab'
import { useRouter } from 'next/router'
import useWhoAmi from 'hooks/useWhoAmi'
import useFrequency from "hooks/useFrequency";
import {onVisibilityChange} from "@pagenote/shared/lib/utils/document";

interface Props {
  children?: ReactNode
}

export default function CloseOnInstalled(props: Props) {
  const { children } = props
  const router = useRouter()
  const [whoAmI] = useWhoAmi();
  // 版本控制
  const { valid } = useVersionValid('0.28.15')
  // 频率控制，7天显示一次
  const [validate] = useFrequency('close-on-installed', 14);
  const { tab } = useCurrentTab();

  useEffect(function(){
    if(whoAmI && whoAmI.extensionPlatform === "360" && validate){
      extApi.developer.chrome({
        "namespace":"tabs",
        type: "create",
        method: 'create',
        arguments: [{
          url: "https://pagenote.cn/360"
        }],
        args: [{
          url: "https://pagenote.cn/360"
        }]
      })
    }
  },[whoAmI])

  function checkClose() {
    // const isPagenoteWeb = tab?.url?.includes('pagenote.cn');
    const closeMe = valid && tab?.id
    // 满足关闭页面条件，自动关闭，避免打扰用户
    if ((closeMe || validate===false)) {
      extApi.developer.chrome({
        namespace: 'tabs',
        type: 'remove',
        method: 'remove',
        args: [tab?.id],
        arguments: [tab?.id]
      })
    }
  }

  useEffect(
    function () {
      checkClose();
      return onVisibilityChange(function () {
        checkClose();
      })
    },
    [valid,validate,tab,router]
  )

  return <div className="">{children}</div>
}
