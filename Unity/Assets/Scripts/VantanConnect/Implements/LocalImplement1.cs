using Cysharp.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;

public class LocalAPIImplement : INetworkImplement
{
    const string URI = "http://localhost:4649/vc/{Command}";

    class GetAddrResult
    {
        public int status;
        public string address;
    }

    async public UniTask<string> GetAddress()
    {
        string request = URI.Replace("{Command}", "getaddr");
        string json = await Network.WebRequest.GetRequest(request);
        var ret = JsonUtility.FromJson<GetAddrResult>(json);
        return ret.address;
    }
}
