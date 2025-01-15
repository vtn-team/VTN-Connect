using Cysharp.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using UnityEngine;

namespace VTNConnect
{
    /// <summary>
    /// 冒険者とリンクする仕組み
    /// </summary>
    public class LinkageSyatem : IVantanConnectEventReceiver
    {
        public bool IsActive => true;
        public bool IsLink => _user != null;

        public UserData UserData => _user;

        UserData _user = null;
        VC_LoginView _view = null;

        public enum VC_LinkageEvent
        {
            Link = 1000,    //リンク
        }

        public void Setup(VC_LoginView view)
        {
            _view = view;
        }

        public void Reset()
        {
            //状態をリセット
            _user = null;
            SetViewEnable(true);
        }

        public void SetViewEnable(bool isEnableView)
        {
            _view?.SetEnable(isEnableView);
        }

        //チェインするデータを受け取り処理する
        public void OnEventCall(EventData data)
        {
            switch ((VC_LinkageEvent)data.EventId)
            {
                case VC_LinkageEvent.Link:
                    {
                        Debug.Log(JsonUtility.ToJson(data));
                        var gameId = data.GetIntData("GameId");
                        if (gameId != ProjectSettings.GameID) break;

                        _view.Link();
                    }
                    break;
            }
        }
    }
}