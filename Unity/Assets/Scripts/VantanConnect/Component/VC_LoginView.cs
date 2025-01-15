using System;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.UI;

namespace VTNConnect
{
    /// <summary>
    /// ログイン時のUI
    /// </summary>
    public class VC_LoginView : MonoBehaviour
    {
        [SerializeField] GameObject _qrRoot;
        [SerializeField] RawImage _outQRImage;
        [SerializeField] GameObject _connect;

        private void Start()
        {
            QRCodeSetup();
            _connect.SetActive(false);
        }

        public void QRCodeSetup()
        {
            _qrRoot.SetActive(VantanConnect.SystemSave.IsUseQRCode);
            if (VantanConnect.SystemSave.IsUseQRCode)
            {
                _outQRImage.texture = QRCodeMaker.BakeCode(VantanConnectQRString.MakeQRStringLinkage());
            }
        }

        public void SetEnable(bool isEnable)
        {
            this.gameObject.SetActive(isEnable);
        }

        public void Link()
        {
            //TODO: 演出

            _connect.SetActive(true);
        }
    }
}