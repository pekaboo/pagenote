import { h } from 'preact';
import {computePosition, convertColor, isMobile} from "@/utils";
import Highlight from '@/assets/images/highlight.svg';
import i18n from '@/locale/i18n';
import Tip from '../tip/Tip'
import './action-bar.scss';

export default function ActionBars ({pagenote}) {
  const recordButtonX = (isMobile ? 0 : pagenote.target.x)+'px';
  const recordButtonY = (isMobile? pagenote.target.y + 50 : pagenote.target.y) + "px";
  const functionColors = pagenote.options.functionColors;
  const brushes = pagenote.options.brushes;
  const showButton = (pagenote.status === pagenote.CONSTANT.WAITING ||
                    pagenote.status === pagenote.CONSTANT.PLAYANDWAIT);

  const canHighlight = pagenote.target && pagenote.target.canHighlight;

  function recordNew(item,level) {
    pagenote.record({
      bg:item.bg,
      level: level || item.level,
    });
  }

  const showAnimation = pagenote.options.showIconAnimation;

  return (
    <pagenote-block style={{
      position: "absolute",
      zIndex: 2147483648,
      left: recordButtonX,
      top: recordButtonY,
      transition: ".5s",
      userSelect: "none",
      textAlign: 'left'
    }}>
      {
        showButton
        &&
        <pagenote-block>
          {
            canHighlight &&
            <pagenote-colors-container>
              {
                brushes.map((item, index) => {
                  const {x:offsetX,y:offsetY} = (isMobile || index===0) ? {
                    x: (index) * - 40,
                    y: 0,
                  } : computePosition(index-1);

                  return(
                    <pagenote-color-button
                         data-pagenotecolor={item.bg}
                         style={{
                           '--color': item.bg,
                           transform: `translate(${offsetX}px,${offsetY}px)`,
                           top: (offsetY / -1) + 'px',
                           left: (offsetX / -1) + 'px',
                           color: convertColor(item.bg).textColor,
                           textShadow: `1px 1px 0px ${convertColor(convertColor(item.bg).textColor).textColor}`,
                           animation:`${(showAnimation&&index!==0)?'colorShow 3s ease-out':''}`,
                           // animationDelay: index*0.1+'s',
                           // transitionDelay: index*0.1+'s',
                         }}
                         onClick={()=>recordNew(item)}
                    >{index!==0?item.shortcut:
                      <span>
                          <Highlight  data-pagenotecolor={item.bg} style={{userSelect:'none'}} fill={item.bg}/>
                      </span> }
                    </pagenote-color-button>
                  )
                })
              }
            </pagenote-colors-container>
          }
          {
            functionColors.map((actionGroup,index)=> {
              // actionGroup filter when
              return (
                <pagenote-plugin-group
                  style={{
                  left: ((index+1)*34+4) + 'px',
                  animationDelay: (index+1) * 0.2 + 's',
                }}>
                  {
                    actionGroup.map((action)=>{
                      const image = /^<svg/.test(action.icon) ?  `data:image/svg+xml;base64,${window.btoa(action.icon)}` : action.icon;
                      return (
                        <Tip message={`${action.name}${action.shortcut?i18n.t('shortcut')+action.shortcut:''}`}>
                          <pagenote-action-button
                            key={action.name}
                            data-eventid={action.eventid}
                            style={{
                              backgroundImage: `url(${image})`,
                            }}
                            onClick={action.onclick}
                            onMouseOver={action.onmouseover}
                            onDblclick={action.ondbclick}
                          >
                          </pagenote-action-button>
                        </Tip>

                      )
                    })
                  }
                </pagenote-plugin-group>
              )
            })
          }
        </pagenote-block>
      }
    </pagenote-block>
  )
}
