using System;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.UI;
using NUnit.Framework.Internal;

namespace VTNConnect
{
    /// <summary>
    /// ログイン時のUI
    /// </summary>
    public class VC_LoginView : MonoBehaviour
    {
        [SerializeField] GameObject _qrRoot;
        [SerializeField] RawImage _outQRImage;
        [SerializeField] VC_LinkFlash _effect;

        private void Start()
        {
            QRCodeSetup();
        }

        public void QRCodeSetup()
        {
#if !AIGAME_IMPLEMENT
            _qrRoot.SetActive(VantanConnect.SystemSave.IsUseQRCode);
            if (VantanConnect.SystemSave.IsUseQRCode)
            {
                _outQRImage.texture = QRCodeMaker.BakeCode(VantanConnectQRString.MakeQRStringLinkage());
            }
#endif
        }

        public void SetEnable(bool isEnable)
        {
            this.gameObject.SetActive(isEnable);
        }

        public void Link(string displayName)
        {
            _effect.Play(displayName);
        }
    }
}