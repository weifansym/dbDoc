## MySQL避免索引列使用 OR 条件
这个亏已经吃过很多次了，在开发以前的sql代码里面，许多以 or 作为where条件的查询，甚至更新。这里举例来说明使用 or 的弊端，以及改进办法。
转自：http://seanlook.com/2016/04/05/mysql-avoid-or-query/
