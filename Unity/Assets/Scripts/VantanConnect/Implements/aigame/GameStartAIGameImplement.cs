using Cysharp.Threading.Tasks;
using System;
using UnityEngine;


/// ���N�G�X�g�p�����[�^�Ȃ�


/// <summary>
/// �߂�l
/// </summary>
public class GameStartAIGameResult
{
    public int Status;
    public string GameHash;
    public UserData[] GameUsers;
    public GameInfo[] GameInfo;
}

/// <summary>
/// �Q�[���I��(AI�Q�[���p)
/// NOTE: https://candle-stoplight-544.notion.site/API-def8a39d6b524c0fbf9e1a552d4b5428#16a39cbfbab9809c83d5efe15acd0e52
/// </summary>
public class GameStartAIGameImplement
{
    /// <summary>
    /// �Q�[���I��(AI�Q�[���p)
    /// </summary>
    /// <param name="instance">API�C���X�^���X</param>
    /// <returns>���U���g</returns>
    async public UniTask<GameStartAIGameResult> Request(GameAPI instance)
    {
        string request = String.Format("{0}/ai/gamestart", ProjectSettings.APIServerURI);
        string json = await Network.WebRequest.PostRequest(request, "{}");
        var ret = JsonUtility.FromJson<GameStartAIGameResult>(json);
        instance.StoreGameHash(ret.GameHash);
        instance.StoreAIGameUsers(ret.GameUsers);
        return ret;
    }
}
