import UserCard from '../account/UserCard'
import DataBackup from './DataBackup'
import {Route, Routes, useNavigate} from 'react-router-dom'
import React, {JSXElementConstructor, ReactElement} from 'react'
import SettingDetail from './SettingDetail'
import extApi from '@pagenote/shared/lib/pagenote-api'
import BasicSettingLine, {SettingMoreButton, SettingSection} from "./BasicSettingLine";
import useWhoAmi from "../../hooks/useWhoAmi";
import DeviceInfo from "../account/DeviceInfo";
import {useWindowSize} from "react-use";
import {MdOutlineSettingsBackupRestore} from "react-icons/md";
import classNames from "classnames";
import ImportAndExport from "../backup/extension/ImportAndExport";
import CheckVersion from "../check/CheckVersion";
import {basePath} from "../../const/env";
import CloudBackup from "../backup/CloudBackup";
import CloudSupporters from "../backup/CloudSupporters";
import CloudBackupList from "../backup/CloudBackupList";
import CloudSync from "../backup/CloudSync";
import ImageCloud from "../backup/extension/ImageCloud";
import LightSetting from "./LightSetting";
import DisabledDetail from "./DisabledDetail";
import ShortCutInfo from "../ShortCutInfo";
import Safety from "./Safety";
import PermissionList from "../permission/PermissionList";
import IdHome from "../account/id/IdHome";

export const routes: Record<string, {
    element: ReactElement<any, string | JSXElementConstructor<any>>,
    title: string
}> = {
    '/': {
        element: <SettingHomeRedirect/>,
        title: ''
    },
    '/data': {
        element: <DataBackup/>,
        title: '数据存储'
    },
    '/data/*': {
        element: <DataBackup/>,
        title: '数据存储'
    },
    '/data/backup': {
        element: <>
            <div className={'bg-card rounded-lg p-2'}>
                <MdOutlineSettingsBackupRestore
                    className={classNames('text-[40px] text-blue-400 m-auto', {})}/>
                <h2 className={'text-lg text-accent-foreground font-bold text-center'}>本地备份</h2>
                <p className={'p-2  text-sm'}>
                    将本设备的数据导出为备份文件，用于恢复或导入其他设备。 </p>
            </div>
            <ImportAndExport/>
            <p className={'py-2 text-sm text-muted-foreground'}>
                <CheckVersion requireVersion={'0.29.5'} fallback={<div></div>}>
                    <span>
                        若需要自动备份，请前往
                        <a className={'more'}
                           href={`${basePath}/ext/setting.html#/data/cloud-backup`}>云端备份</a>
                    </span>
                </CheckVersion>
            </p>
        </>,
        title: '本地备份'
    },
    "/data/cloud-backup": {
        element: <CloudBackup/>,
        title: '云备份'
    },
    '/data/cloud-supporters': {
        element: <CloudSupporters/>,
        title: '云盘服务商'
    },
    '/data/cloud-backup/history':
        {
            element: <CloudBackupList/>,
            title: '备份历史'
        },
    '/data/cloud-sync': {
        element: <CloudSync/>,
        title: '云同步'
    },
    '/data/image-cloud': {
        element: <ImageCloud/>,
        title: '图床'
    },
    '/light': {
        element: <LightSetting/>,
        title: '画笔设置'
    },
    '/light/disable': {
        element: <DisabledDetail/>,
        title: '网页禁用规则'
    },
    '/shortcut':
        {
            element: <ShortCutInfo/>,
            title: '快捷键'
        },
    '/backup':
        {
            element: <CloudBackup/>,
            title: '云备份'
        },

    '/backup/supporters':
        {
            element: <CloudSupporters/>,
            title: '云端存储服务商'
        },
    '/safety':
        {
            element: <Safety/>,
            title: '隐私与安全'
        },
    '/safety/permission': {
        element: <PermissionList/>,
        title: '权限管理'
    },
    '/id/*': {
        element: <IdHome basePath={'/id'}/>,
        title: ''
    },
    '*': {
        element: <SettingHomeRedirect/>,
        title: ''
    }
}
function SettingHomeRedirect() {
    const {width} = useWindowSize(900, 600)
    return (
        width < 600 ?
            <SettingHome/> :
            <DataBackup/>
    )
}

function SettingHome() {
    const [whoAmI] = useWhoAmi()
    const navigate = useNavigate();

    function onClickUser() {
        extApi.commonAction.openTab({
            reUse: true,
            url: 'https://pagenote.cn/account',
            tab: {},
        })
    }

    return (
        <div>
            <div className={'mb-4'}>
                <UserCard editable={false} onClick={onClickUser}>
                    <SettingMoreButton onClick={() => {
                        navigate('/id')
                    }}/>
                </UserCard>
            </div>
            <SettingSection>
                <BasicSettingLine label={'数据存储'} path={'/data'}/>
                <BasicSettingLine
                    label={'画笔设置'}
                    path={'/light'}
                />
                <BasicSettingLine label={'快捷键'} path={'/shortcut'}/>
            </SettingSection>

            <SettingSection className={'my-4'}>
                <BasicSettingLine label={'隐私与安全'} path={'/safety'}/>
            </SettingSection>


            <SettingSection className={'mt-6'}>
                <BasicSettingLine
                    label={'版本'}
                    subLabel={<a className={'hover:underline'} href={whoAmI?.extensionStoreUrl}
                                 target={'_blank'}>{whoAmI?.extensionPlatform}</a>}
                    right={
                        <DeviceInfo/>
                    }
                />
            </SettingSection>
        </div>
    )
}

export default function Setting() {
    return (
        <div className={'m-auto sm:p-1 p-3 flex gap-16'}>
            <div className={'lg:block hidden'}>
                <SettingHome/>
            </div>
            <div className="w-full flex-grow">
                <Routes>
                    {
                        Object.keys(routes).map((path) => {
                            const item = routes[path];
                            return (
                                <Route key={path} path={path} element={
                                    <SettingDetail label={item.title || ''}>
                                        {item.element}
                                    </SettingDetail>
                                }/>
                            )
                        })
                    }
                </Routes>
            </div>
        </div>
    )
}
