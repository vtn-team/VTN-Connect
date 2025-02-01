
//これはコードで自動生成されます
//みんなが使用できるイベントのみが表示されます
namespace VTNConnect
{
    public enum EventDefine
    {
        DemonUI = 101,  //岩垂UIの憑依 (BossBattle2D -> すべてのゲーム、None)
        ActorEffect = 105,  //アクターにランダム効果 (すべてのゲーム -> Confront、GameOnly)
        ReviveGimmick = 106,  //ステージギミック復活(罠系) (すべてのゲーム -> Confront、None)
        DarkRoom = 107,  //照明の光度が一定時間低下する。 (すべてのゲーム -> Confront、GameOnly)
        SummonEnemy = 109,  //プレイヤーの頭上から雑魚敵が降ってくる (すべてのゲーム -> Confront、GameOnly)
        KnockWindow = 116,  //窓をたたく音を出す (すべてのゲーム -> ToyBox、GameOnly)
        EnemyEscape = 130,  //敵が逃げた (SampleGame -> すべてのゲーム、GameOnly)
        Cheer = 1001,  //おうえんメッセージ (バンコネシステム -> すべてのゲーム、ALL)
        BonusCoin = 1002,  //コイン増える (バンコネシステム -> すべてのゲーム、ALL)
        Levelup = 1003,  //レベルが上がった (バンコネシステム -> すべてのゲーム、ALL)
        GetArtifact = 1004,  //アーティファクトを獲得 (バンコネシステム -> すべてのゲーム、ALL)

    }
}
