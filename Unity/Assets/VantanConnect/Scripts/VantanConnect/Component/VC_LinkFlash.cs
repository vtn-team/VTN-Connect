using System;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.UI;
using PlasticGui;

namespace VTNConnect
{
    /// <summary>
    /// リンク時の演出
    /// </summary>
    public class VC_LinkFlash : MonoBehaviour
    {
        [SerializeField] Animator _animator;
        [SerializeField] GameObject _linkTextRoot;
        [SerializeField] Text _linkText;

        private void Start()
        {
#if !AIGAME_IMPLEMENT
            Setup();
#endif
        }

        void Setup()
        {
        }

        public void Play(string name)
        {
            Debug.Log("Link" + name);
            _linkText.text = name + "がリンク！";
            _animator.Play("Link");
        }
    }
}