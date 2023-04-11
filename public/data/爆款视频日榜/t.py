import os

sqlQueryTemplate = "INSERT INTO hot_videos ( `record_date`, `video_name`, `up_name`, `play_time_increased`, `play_time`,`like_time_increased`, `like_time`,`save_time_increased`, `save_time`,`comment_time_increased`, `comment_time`,`coin_time_increased`, `coin_time`,`type_first`, `type_second`) VALUES ("

filePath = '/mnt/c/Users/16834/Desktop/可视化大作业数据/爆款视频日榜'
fileNameList = []
for i, j, k in os.walk(filePath):
    fileNameList = k
print(k)

with open("query.txt", "w") as my_file:
    for fileName in fileNameList:
        if fileName == 't.py':
            continue
        print(fileName)
        f = open(fileName, 'r', encoding="gbk")
        line = f.readline()
        print(line)
        while line:
            line = f.readline()
            if line == '':
                break
            lineSplit = line.split(',')
            # print(lineSplit)

            nameSplit = fileName.split('月')
            yearSplit = nameSplit[0].split('年')[0]
            monthSplit = nameSplit[0].split('年')[1]
            daySplit = nameSplit[1].split('日')[0]
            dateStr = yearSplit+'-'+monthSplit+'-'+daySplit
            dateStr = "'"+dateStr+"'"
            # print(dateStr)

            sqlQuery = sqlQueryTemplate\
                + dateStr\
                + ","+"'"+lineSplit[0].replace("'", "")+"'"\
                + ","+"'"+lineSplit[1]+"'"\
                + ","+lineSplit[2]\
                + ","+lineSplit[3]\
                + ","+lineSplit[4]\
                + ","+lineSplit[5]\
                + ","+lineSplit[6]\
                + ","+lineSplit[7]\
                + ","+lineSplit[8]\
                + ","+lineSplit[9]\
                + ","+lineSplit[10]\
                + ","+lineSplit[11]\
                + ","+"'"+lineSplit[12]+"'"\
                + ","+"'"+lineSplit[13][:-1]+"'"\
                + ");"
            # print(sqlQuery)

            my_file.write(sqlQuery+"\n")
