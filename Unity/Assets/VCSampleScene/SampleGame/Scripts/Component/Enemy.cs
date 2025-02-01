using UnityEngine;
using UnityEngine.UI;
using VTNConnect;

namespace GameLoopTest
{
    /// <summary>
    /// 落下するボール
    /// </summary>
    public class Enemy : MonoBehaviour
    {
        void Update()
        {
            if(this.transform.position.y < -20)
            {
                /*
                //イベントを送信する
                EventData data = new EventData(EventDefine.Cheer);
                data.DataPack("Position", this.transform.position);
                VantanConnect.SendEvent(data);
                */

                GameEpisode epic = new GameEpisode(EpisodeCode.SGEnemyLeave);
                epic.SetEpisode("敵を逃がしてしまった");
                epic.DataPack("敵を逃がした位置", this.transform.position);
                VantanConnect.SendEpisode(epic);

                ScoreManager.AddScore(-100);

                //消える
                Destroy(this.gameObject);
            }
        }

        private void OnCollisionEnter(Collision collision)
        {
            if (collision.gameObject.CompareTag("Player"))
            {
                ScoreManager.AddScore(500);
                Destroy(this.gameObject);
            }
        }
    }
}