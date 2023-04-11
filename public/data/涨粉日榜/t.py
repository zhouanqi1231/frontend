import os

sqlQueryTemplate = "INSERT INTO follower_increase_uploaders ( `record_date`, `up_id`, `up_name`, `up_addr`, `increase_num`, `follower_num`, `increase_ratio`, `type_first`, `type_second`, `comment_words`) VALUES ("

filePath = '/mnt/c/Users/16834/Desktop/可视化大作业数据/涨粉日榜'
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

            nameSplit = fileName.split('月')
            yearSplit = nameSplit[0].split('年')[0]
            monthSplit = nameSplit[0].split('年')[1]
            daySplit = nameSplit[1].split('日')[0]
            dateStr = yearSplit+'-'+monthSplit+'-'+daySplit
            dateStr = "'"+dateStr+"',"

            sqlQuery = sqlQueryTemplate+dateStr+lineSplit[0]\
                + ","+"'"+lineSplit[1]+"'"\
                + ","+"'"+lineSplit[2]+"'"\
                + ","+lineSplit[5]\
                + ","+lineSplit[4]\
                + ","+lineSplit[6][:-1]\
                + ","+"'"+lineSplit[7]+"'"\
                + ","+"'"+lineSplit[8][:-1]+"'"\
                + ","+"'');"

            my_file.write(sqlQuery+"\n")
