#!/usr/bin/env ruby

require 'sequel'
require 'inifile'
require 'json'
require 'pp'

BINPATH="#{ENV['DLXSROOT']}/bin/i/image"

$config = IniFile.load("#{BINPATH}/etc/package.conf")
$config[:DB] = Sequel.connect(:adapter=>'mysql2', :host=>$config['mysql']['host'], :database=>$config['mysql']['database'], :user=>$config['mysql']['user'], :password=>$config['mysql']['password'])

input_pathname = ARGV[0]
input_filenames = Dir.glob(File.join(input_pathname, "*.js"))
input_filenames.each do |input_filename|

  puts "-- processing: #{input_filename}"

  identifier = File.basename(input_filename, ".js")

  data = JSON.parse(File.read(input_filename))
  original_translation = []
  data['lines'].each do |line|
    data['footnote'].each do |fid, footnote|
      marker = "{#{fid}}"
      if line.index(marker)
        line.gsub!(marker, "{#{footnote}}")
      end
    end
    original_translation << line
  end
  original_translation = original_translation.to_json
  annotations = []
  data['regions'].each do |region|
    if region[-1]
      content = region.pop()
      data['footnote'].each do |fid, footnote|
        marker = "{#{fid}}"
        if content.index(marker)
          content.gsub!(marker, "{#{footnote}}")
        end
      end
      region << content
    end
    annotations << region
  end
  annotations = annotations.to_json

  stat = File::Stat.new(input_filename)

  $config[:DB][:ImageClassAnnotation].replace(
    identifier: identifier,
    published: 0,
    updated_at: stat.mtime,
    original_translation: original_translation,
    annotations: annotations,
    remote_user: data['regions'].size > 0 ? 'monicats' : 'import',
  )

  # heck, publish as well
  $config[:DB][:ImageClassAnnotation].replace(
    identifier: identifier,
    published: 1,
    updated_at: stat.mtime,
    published_at: stat.mtime,
    original_translation: original_translation,
    annotations: annotations,
    remote_user: data['regions'].size > 0 ? 'monicats' : 'import',
  )


end

puts "-30-"
